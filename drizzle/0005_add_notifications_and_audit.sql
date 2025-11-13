-- Migration to add notifications table for email and alert tracking
-- Version: 0005
-- Generated: 2025-11-10

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loanApplicationId INT,
  
  -- Notification details
  type ENUM(
    'loan_submitted',
    'loan_approved',
    'loan_rejected',
    'payment_confirmed',
    'loan_disbursed',
    'payment_reminder',
    'general'
  ) NOT NULL,
  
  channel ENUM('email', 'sms', 'push') DEFAULT 'email' NOT NULL,
  
  recipient VARCHAR(320) NOT NULL, -- email or phone
  subject VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Status tracking
  status ENUM(
    'pending',
    'sent',
    'delivered',
    'failed',
    'bounced'
  ) DEFAULT 'pending' NOT NULL,
  
  sentAt TIMESTAMP NULL,
  deliveredAt TIMESTAMP NULL,
  errorMessage TEXT,
  
  -- Metadata
  metadata TEXT, -- JSON string for additional data
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Indexes for performance
  INDEX idx_user_id (userId),
  INDEX idx_loan_application_id (loanApplicationId),
  INDEX idx_status (status),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add documents table for file uploads
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loanApplicationId INT,
  
  -- Document details
  documentType ENUM(
    'id_proof',
    'address_proof',
    'income_proof',
    'bank_statement',
    'tax_return',
    'other'
  ) NOT NULL,
  
  fileName VARCHAR(255) NOT NULL,
  fileSize INT NOT NULL, -- in bytes
  mimeType VARCHAR(100) NOT NULL,
  
  -- Storage details
  s3Key VARCHAR(500) NOT NULL UNIQUE,
  s3Bucket VARCHAR(100) NOT NULL,
  
  -- Status
  status ENUM('uploaded', 'verified', 'rejected', 'deleted') DEFAULT 'uploaded' NOT NULL,
  rejectionReason TEXT,
  
  -- Timestamps
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  verifiedAt TIMESTAMP NULL,
  deletedAt TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_user_id (userId),
  INDEX idx_loan_application_id (loanApplicationId),
  INDEX idx_document_type (documentType),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add audit log table for compliance and security
CREATE TABLE IF NOT EXISTS auditLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- User and action details
  userId INT,
  action VARCHAR(100) NOT NULL,
  resourceType VARCHAR(50) NOT NULL,
  resourceId INT,
  
  -- Changes tracking
  changesBefore TEXT, -- JSON
  changesAfter TEXT, -- JSON
  
  -- Request details
  ipAddress VARCHAR(45), -- IPv4 or IPv6
  userAgent TEXT,
  requestId VARCHAR(100),
  
  -- Result
  success BOOLEAN NOT NULL,
  errorMessage TEXT,
  
  -- Timestamp
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Indexes
  INDEX idx_user_id (userId),
  INDEX idx_resource (resourceType, resourceId),
  INDEX idx_action (action),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add performance metrics table
CREATE TABLE IF NOT EXISTS performanceMetrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Metric details
  metricName VARCHAR(100) NOT NULL,
  metricValue DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- ms, seconds, count, bytes, etc.
  
  -- Context
  endpoint VARCHAR(255),
  userId INT,
  metadata TEXT, -- JSON
  
  -- Timestamp
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Indexes
  INDEX idx_metric_name (metricName),
  INDEX idx_endpoint (endpoint),
  INDEX idx_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
