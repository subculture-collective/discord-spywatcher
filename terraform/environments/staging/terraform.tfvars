# Staging Environment Configuration

environment = "staging"
aws_region  = "us-east-1"
project_name = "spywatcher"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
private_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
public_subnet_cidrs  = ["10.1.101.0/24", "10.1.102.0/24"]
database_subnet_cidrs = ["10.1.201.0/24", "10.1.202.0/24"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    desired_size   = 2
    min_size       = 1
    max_size       = 4
    instance_types = ["t3.medium"]
    capacity_type  = "ON_DEMAND"
  }
}

# RDS Configuration
rds_engine_version    = "15.3"
rds_instance_class    = "db.t3.medium"
rds_allocated_storage = 50
database_name         = "spywatcher"
database_username     = "spywatcher"

# Redis Configuration
redis_node_type      = "cache.t3.small"
redis_num_cache_nodes = 1

# SSL Certificate
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Additional Tags
tags = {
  Terraform   = "true"
  Environment = "staging"
  Project     = "spywatcher"
}
