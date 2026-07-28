from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Journey(Base):
    __tablename__ = "journey"
    
    id = Column(String(50), primary_key=True, index=True)
    description = Column(String(255))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    versions = relationship("JourneyVersion", back_populates="journey")
    executions = relationship("JourneyExecution", back_populates="journey")

class JourneyVersion(Base):
    __tablename__ = "journey_version"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    journey_id = Column(String(50), ForeignKey("journey.id"))
    version = Column(Integer)
    steps = Column(JSON) # Store steps as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    journey = relationship("Journey", back_populates="versions")

class JourneyExecution(Base):
    __tablename__ = "journey_execution"
    
    id = Column(String(100), primary_key=True, index=True) # E.g., uuid
    journey_id = Column(String(50), ForeignKey("journey.id"))
    version_id = Column(Integer, ForeignKey("journey_version.id"))
    status = Column(String(20)) # PASS, FAIL, RUNNING
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    worker_id = Column(String(50), ForeignKey("worker.id"), nullable=True)
    video_path = Column(String(255), nullable=True)
    trace_path = Column(String(255), nullable=True)
    
    journey = relationship("Journey", back_populates="executions")
    steps = relationship("JourneyExecutionStep", back_populates="execution")

class JourneyExecutionStep(Base):
    __tablename__ = "journey_execution_step"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    execution_id = Column(String(100), ForeignKey("journey_execution.id"))
    step_index = Column(Integer)
    action = Column(String(50))
    expected = Column(Text, nullable=True)
    actual = Column(Text, nullable=True)
    status = Column(String(20)) # PASS, FAIL
    screenshot_path = Column(String(255), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    execution = relationship("JourneyExecution", back_populates="steps")

class Worker(Base):
    __tablename__ = "worker"
    
    id = Column(String(50), primary_key=True, index=True)
    status = Column(String(20))
    last_ping = Column(DateTime, default=datetime.utcnow)

class Telegram(Base):
    __tablename__ = "telegram"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    message = Column(Text)
    status = Column(String(20)) # SENT, FAILED
    sent_at = Column(DateTime, default=datetime.utcnow)

class Configuration(Base):
    __tablename__ = "configuration"
    
    key = Column(String(50), primary_key=True)
    value = Column(String(255))

class ApplicationLog(Base):
    __tablename__ = "application_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(20))
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExecutionAttachment(Base):
    __tablename__ = "execution_attachment"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    execution_id = Column(String(100), ForeignKey("journey_execution.id"))
    type = Column(String(20)) # HTML, DOM, TRACE
    path = Column(String(255))
