"""
Pi Shield Worker - Media Processing Pipeline
Handles image, video, and text analysis jobs from Redis queue
"""

import os
import json
import time
import asyncio
import tempfile
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

import redis
import asyncpg
import structlog
from google.cloud import storage, vision, speech, videointelligence
from PIL import Image
import uuid

# Configure logging
logger = structlog.get_logger()

class Config:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/pishield")
    GCS_BUCKET = os.getenv("GCS_BUCKET", "pi-shield-uploads")
    WORKER_ID = os.getenv("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}")
    
    # Processing limits
    MAX_VIDEO_DURATION = int(os.getenv("MAX_VIDEO_DURATION", "300"))  # 5 minutes
    FRAME_SAMPLE_RATE = int(os.getenv("FRAME_SAMPLE_RATE", "1"))  # 1 frame per second
    MAX_IMAGE_SIZE = (1920, 1080)

config = Config()

class MediaProcessor:
    """Handles different types of media analysis"""
    
    def __init__(self):
        self.storage_client = storage.Client()
        self.vision_client = vision.ImageAnnotatorClient()
        self.speech_client = speech.SpeechClient()
        self.video_client = videointelligence.VideoIntelligenceServiceClient()
    
    async def process_image(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process image for deepfake/manipulation detection"""
        logger.info("Processing image", analysis_id=job["analysis_id"])
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download image
            local_path = await self._download_file(job["input_uri"], temp_dir)
            
            # Basic image validation and preprocessing
            try:
                with Image.open(local_path) as img:
                    # Resize if too large
                    if img.size[0] > config.MAX_IMAGE_SIZE[0] or img.size[1] > config.MAX_IMAGE_SIZE[1]:
                        img.thumbnail(config.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                        img.save(local_path)
                    
                    image_info = {
                        "width": img.size[0],
                        "height": img.size[1],
                        "format": img.format,
                        "mode": img.mode
                    }
            except Exception as e:
                logger.error("Image processing failed", error=str(e))
                raise
            
            # Google Vision API analysis
            with open(local_path, 'rb') as image_file:
                content = image_file.read()
            
            image = vision.Image(content=content)
            
            # Multiple detection types
            features = [
                vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=10),
                vision.Feature(type_=vision.Feature.Type.FACE_DETECTION, max_results=10),
                vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION),
                vision.Feature(type_=vision.Feature.Type.SAFE_SEARCH_DETECTION),
                vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION, max_results=10)
            ]
            
            request = vision.AnnotateImageRequest(image=image, features=features)
            response = self.vision_client.annotate_image(request=request)
            
            # Process results
            vision_results = {
                "labels": [{"description": label.description, "score": label.score} 
                          for label in response.label_annotations],
                "faces": [self._process_face_annotation(face) 
                         for face in response.face_annotations],
                "text": response.full_text_annotation.text if response.full_text_annotation else "",
                "safe_search": self._process_safe_search(response.safe_search_annotation),
                "objects": [{"name": obj.name, "score": obj.score} 
                           for obj in response.localized_object_annotations]
            }
            
            # Calculate credibility score
            credibility_score, explanation = self._calculate_image_credibility(
                vision_results, image_info
            )
            
            return {
                "credibility_score": credibility_score,
                "explanation": explanation,
                "vision_results": vision_results,
                "image_info": image_info
            }
    
    async def process_video(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process video for deepfake detection"""
        logger.info("Processing video", analysis_id=job["analysis_id"])
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download video
            local_path = await self._download_file(job["input_uri"], temp_dir)
            
            # Get video info
            video_info = await self._get_video_info(local_path)
            
            if video_info["duration"] > config.MAX_VIDEO_DURATION:
                raise ValueError(f"Video too long: {video_info['duration']}s (max: {config.MAX_VIDEO_DURATION}s)")
            
            # Extract frames
            frames_dir = Path(temp_dir) / "frames"
            frames_dir.mkdir()
            
            frame_paths = await self._extract_frames(local_path, frames_dir)
            
            # Extract audio for speech analysis
            audio_path = Path(temp_dir) / "audio.wav"
            await self._extract_audio(local_path, audio_path)
            
            # Analyze frames (sample subset for efficiency)
            frame_results = []
            sample_frames = frame_paths[::max(1, len(frame_paths) // 10)]  # Max 10 frames
            
            for frame_path in sample_frames:
                with open(frame_path, 'rb') as f:
                    content = f.read()
                
                image = vision.Image(content=content)
                features = [
                    vision.Feature(type_=vision.Feature.Type.FACE_DETECTION, max_results=5),
                    vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=5)
                ]
                
                request = vision.AnnotateImageRequest(image=image, features=features)
                response = self.vision_client.annotate_image(request=request)
                
                frame_results.append({
                    "frame": frame_path.name,
                    "faces": [self._process_face_annotation(face) for face in response.face_annotations],
                    "labels": [{"description": label.description, "score": label.score} 
                              for label in response.label_annotations]
                })
            
            # Speech-to-text analysis
            transcript = ""
            if audio_path.exists() and audio_path.stat().st_size > 0:
                transcript = await self._transcribe_audio(audio_path)
            
            # Calculate credibility score
            credibility_score, explanation = self._calculate_video_credibility(
                frame_results, transcript, video_info
            )
            
            return {
                "credibility_score": credibility_score,
                "explanation": explanation,
                "video_info": video_info,
                "frame_analysis": frame_results,
                "transcript": transcript
            }
    
    async def process_text(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Process text for AI-generated content detection"""
        logger.info("Processing text", analysis_id=job["analysis_id"])
        
        # Download and read text
        with tempfile.TemporaryDirectory() as temp_dir:
            local_path = await self._download_file(job["input_uri"], temp_dir)
            
            with open(local_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        
        # Basic text analysis
        text_stats = {
            "char_count": len(text_content),
            "word_count": len(text_content.split()),
            "sentence_count": len([s for s in text_content.split('.') if s.strip()]),
            "paragraph_count": len([p for p in text_content.split('\n\n') if p.strip()])
        }
        
        # AI-generated text detection patterns
        ai_patterns = [
            r"as an ai",
            r"i don't have personal",
            r"i cannot provide",
            r"as a language model",
            r"i'm not able to",
            r"i don't have the ability",
            r"as an artificial intelligence"
        ]
        
        pattern_matches = []
        for pattern in ai_patterns:
            import re
            matches = re.findall(pattern, text_content.lower())
            if matches:
                pattern_matches.extend(matches)
        
        # Calculate credibility score
        credibility_score, explanation = self._calculate_text_credibility(
            text_content, text_stats, pattern_matches
        )
        
        return {
            "credibility_score": credibility_score,
            "explanation": explanation,
            "text_stats": text_stats,
            "ai_patterns_found": pattern_matches,
            "content_preview": text_content[:500] + "..." if len(text_content) > 500 else text_content
        }
    
    async def _download_file(self, gcs_uri: str, temp_dir: str) -> str:
        """Download file from GCS to local temp directory"""
        bucket_name, blob_path = gcs_uri.replace("gs://", "").split("/", 1)
        bucket = self.storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        local_path = os.path.join(temp_dir, os.path.basename(blob_path))
        blob.download_to_filename(local_path)
        
        return local_path
    
    async def _get_video_info(self, video_path: str) -> Dict[str, Any]:
        """Get video metadata using ffprobe"""
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", 
            "-show_streams", video_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            info = json.loads(result.stdout)
            
            video_stream = next((s for s in info["streams"] if s["codec_type"] == "video"), {})
            
            return {
                "duration": float(info["format"].get("duration", 0)),
                "size": int(info["format"].get("size", 0)),
                "width": int(video_stream.get("width", 0)),
                "height": int(video_stream.get("height", 0)),
                "fps": eval(video_stream.get("r_frame_rate", "0/1")),
                "codec": video_stream.get("codec_name", "unknown")
            }
        except (subprocess.CalledProcessError, json.JSONDecodeError, KeyError) as e:
            logger.error("Failed to get video info", error=str(e))
            return {"duration": 0, "size": 0, "width": 0, "height": 0, "fps": 0, "codec": "unknown"}
    
    async def _extract_frames(self, video_path: str, output_dir: Path) -> list:
        """Extract frames from video"""
        cmd = [
            "ffmpeg", "-i", video_path, "-vf", f"fps=1/{config.FRAME_SAMPLE_RATE}",
            "-y", str(output_dir / "frame_%04d.jpg")
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return sorted(list(output_dir.glob("frame_*.jpg")))
        except subprocess.CalledProcessError as e:
            logger.error("Frame extraction failed", error=str(e))
            return []
    
    async def _extract_audio(self, video_path: str, audio_path: Path):
        """Extract audio from video"""
        cmd = [
            "ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", 
            "-ar", "16000", "-ac", "1", "-y", str(audio_path)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, check=True)
        except subprocess.CalledProcessError as e:
            logger.error("Audio extraction failed", error=str(e))
    
    async def _transcribe_audio(self, audio_path: Path) -> str:
        """Transcribe audio using Google Speech-to-Text"""
        try:
            with open(audio_path, 'rb') as audio_file:
                content = audio_file.read()
            
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US",
            )
            
            response = self.speech_client.recognize(config=config, audio=audio)
            
            transcript = " ".join([result.alternatives[0].transcript 
                                 for result in response.results])
            
            return transcript
        except Exception as e:
            logger.error("Speech transcription failed", error=str(e))
            return ""
    
    def _process_face_annotation(self, face) -> Dict[str, Any]:
        """Process face detection results"""
        return {
            "detection_confidence": face.detection_confidence,
            "joy_likelihood": face.joy_likelihood.name,
            "anger_likelihood": face.anger_likelihood.name,
            "surprise_likelihood": face.surprise_likelihood.name,
            "under_exposed_likelihood": face.under_exposed_likelihood.name,
            "blurred_likelihood": face.blurred_likelihood.name,
            "headwear_likelihood": face.headwear_likelihood.name
        }
    
    def _process_safe_search(self, safe_search) -> Dict[str, str]:
        """Process safe search results"""
        return {
            "adult": safe_search.adult.name,
            "spoof": safe_search.spoof.name,
            "medical": safe_search.medical.name,
            "violence": safe_search.violence.name,
            "racy": safe_search.racy.name
        }
    
    def _calculate_image_credibility(self, vision_results: Dict, image_info: Dict) -> tuple:
        """Calculate credibility score for images"""
        score = 0.8  # Base score
        factors = []
        
        # Face analysis
        faces = vision_results.get("faces", [])
        if faces:
            avg_confidence = sum(f["detection_confidence"] for f in faces) / len(faces)
            if avg_confidence < 0.7:
                score -= 0.3
                factors.append("Low face detection confidence")
            
            # Check for blurred faces (potential manipulation)
            blurred_faces = sum(1 for f in faces if "LIKELY" in f.get("blurred_likelihood", ""))
            if blurred_faces > 0:
                score -= 0.2
                factors.append(f"{blurred_faces} blurred faces detected")
        
        # Safe search indicators
        safe_search = vision_results.get("safe_search", {})
        if safe_search.get("spoof") in ["LIKELY", "VERY_LIKELY"]:
            score -= 0.4
            factors.append("Potential spoofing detected")
        
        # Label analysis for artificial content
        labels = vision_results.get("labels", [])
        artificial_labels = [l for l in labels if any(term in l["description"].lower() 
                           for term in ["artificial", "synthetic", "generated", "fake", "computer"])]
        if artificial_labels:
            score -= 0.3
            factors.append(f"Artificial content indicators: {[l['description'] for l in artificial_labels]}")
        
        score = max(0.0, min(1.0, score))
        
        explanation = {
            "primary_factors": factors,
            "face_count": len(faces),
            "artificial_labels": len(artificial_labels),
            "image_quality": "high" if image_info.get("width", 0) > 1000 else "medium"
        }
        
        return score, explanation
    
    def _calculate_video_credibility(self, frame_results: list, transcript: str, video_info: Dict) -> tuple:
        """Calculate credibility score for videos"""
        score = 0.75  # Base score for video
        factors = []
        
        # Analyze face consistency across frames
        face_counts = [len(frame.get("faces", [])) for frame in frame_results]
        if face_counts:
            face_variance = max(face_counts) - min(face_counts)
            if face_variance > 2:
                score -= 0.2
                factors.append("Inconsistent face detection across frames")
            
            # Average face confidence
            all_faces = [face for frame in frame_results for face in frame.get("faces", [])]
            if all_faces:
                avg_confidence = sum(f["detection_confidence"] for f in all_faces) / len(all_faces)
                if avg_confidence < 0.6:
                    score -= 0.3
                    factors.append("Low average face detection confidence")
        
        # Transcript analysis
        if transcript:
            # Check for AI-generated speech patterns
            ai_phrases = ["as an ai", "i cannot", "i don't have personal"]
            if any(phrase in transcript.lower() for phrase in ai_phrases):
                score -= 0.4
                factors.append("AI-generated speech patterns detected")
        
        # Video quality indicators
        if video_info.get("width", 0) < 720:
            score -= 0.1
            factors.append("Low resolution video")
        
        score = max(0.0, min(1.0, score))
        
        explanation = {
            "primary_factors": factors,
            "frame_count_analyzed": len(frame_results),
            "transcript_length": len(transcript.split()) if transcript else 0,
            "video_duration": video_info.get("duration", 0)
        }
        
        return score, explanation
    
    def _calculate_text_credibility(self, text: str, stats: Dict, ai_patterns: list) -> tuple:
        """Calculate credibility score for text"""
        score = 0.9  # Base score for text
        factors = []
        
        # AI pattern detection
        if ai_patterns:
            score -= min(0.6, len(ai_patterns) * 0.2)
            factors.append(f"AI-generated patterns found: {ai_patterns}")
        
        # Text structure analysis
        if stats["word_count"] > 0:
            avg_sentence_length = stats["word_count"] / max(1, stats["sentence_count"])
            if avg_sentence_length > 30:
                score -= 0.1
                factors.append("Unusually long sentences")
            elif avg_sentence_length < 5:
                score -= 0.1
                factors.append("Unusually short sentences")
        
        # Repetition check (simple)
        words = text.lower().split()
        if len(words) > 10:
            unique_words = len(set(words))
            repetition_ratio = unique_words / len(words)
            if repetition_ratio < 0.3:
                score -= 0.2
                factors.append("High word repetition detected")
        
        score = max(0.0, min(1.0, score))
        
        explanation = {
            "primary_factors": factors,
            "text_length": stats["word_count"],
            "ai_patterns_count": len(ai_patterns),
            "structure_analysis": "normal" if not factors else "suspicious"
        }
        
        return score, explanation

class Worker:
    """Main worker class that processes jobs from Redis queue"""
    
    def __init__(self):
        self.redis_client = redis.from_url(config.REDIS_URL)
        self.processor = MediaProcessor()
        self.db_pool = None
    
    async def start(self):
        """Start the worker"""
        # Initialize database connection
        self.db_pool = await asyncpg.create_pool(config.DATABASE_URL, min_size=2, max_size=5)
        
        logger.info("Worker started", worker_id=config.WORKER_ID)
        
        while True:
            try:
                # Block and wait for job
                item = self.redis_client.blpop("pi_jobs", timeout=5)
                if not item:
                    await asyncio.sleep(1)
                    continue
                
                _, payload = item
                job = json.loads(payload)
                
                await self.process_job(job)
                
            except KeyboardInterrupt:
                logger.info("Worker shutting down")
                break
            except Exception as e:
                logger.error("Worker error", error=str(e))
                await asyncio.sleep(5)
        
        if self.db_pool:
            await self.db_pool.close()
    
    async def process_job(self, job: Dict[str, Any]):
        """Process a single analysis job"""
        analysis_id = job["analysis_id"]
        input_type = job["input_type"]
        
        logger.info("Processing job", 
                   analysis_id=analysis_id, 
                   input_type=input_type,
                   worker_id=config.WORKER_ID)
        
        try:
            # Update status to processing
            await self._update_analysis_status(analysis_id, "processing")
            
            # Process based on input type
            if input_type == "image":
                results = await self.processor.process_image(job)
            elif input_type == "video":
                results = await self.processor.process_video(job)
            elif input_type == "text":
                results = await self.processor.process_text(job)
            else:
                raise ValueError(f"Unsupported input type: {input_type}")
            
            # Store results
            await self._store_results(analysis_id, results)
            
            # Update status to done
            await self._update_analysis_status(analysis_id, "done")
            
            logger.info("Job completed", 
                       analysis_id=analysis_id,
                       credibility_score=results["credibility_score"])
            
        except Exception as e:
            logger.error("Job processing failed", 
                        analysis_id=analysis_id, 
                        error=str(e))
            
            await self._update_analysis_status(analysis_id, "failed")
            
            # Store error information
            error_results = {
                "credibility_score": None,
                "explanation": {"error": str(e), "status": "failed"},
                "error_details": str(e)
            }
            await self._store_results(analysis_id, error_results)
    
    async def _update_analysis_status(self, analysis_id: str, status: str):
        """Update analysis status in database"""
        async with self.db_pool.acquire() as conn:
            finished_at = datetime.utcnow() if status in ["done", "failed"] else None
            await conn.execute(
                "UPDATE analyses SET status = $1, finished_at = $2 WHERE id = $3",
                status, finished_at, uuid.UUID(analysis_id)
            )
    
    async def _store_results(self, analysis_id: str, results: Dict[str, Any]):
        """Store analysis results in database"""
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO analysis_reports (id, analysis_id, credibility_score, explanation, artifacts, version, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (analysis_id) DO UPDATE SET
                   credibility_score = EXCLUDED.credibility_score,
                   explanation = EXCLUDED.explanation,
                   artifacts = EXCLUDED.artifacts,
                   version = EXCLUDED.version""",
                uuid.uuid4(), uuid.UUID(analysis_id), 
                results.get("credibility_score"),
                json.dumps(results.get("explanation", {})),
                json.dumps(results.get("artifacts", {})),
                "v1.0", datetime.utcnow()
            )

async def main():
    """Main entry point"""
    worker = Worker()
    await worker.start()

if __name__ == "__main__":
    asyncio.run(main())