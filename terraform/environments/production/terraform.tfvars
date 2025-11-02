# Production Environment Configuration

environment = "production"
aws_region  = "us-east-1"
project_name = "spywatcher"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
database_subnet_cidrs = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

# EKS Configuration
eks_cluster_version = "1.28"
eks_node_groups = {
  general = {
    desired_size   = 3
    min_size       = 2
    max_size       = 10
    instance_types = ["t3.large"]
    capacity_type  = "ON_DEMAND"
  }
  spot = {
    desired_size   = 2
    min_size       = 0
    max_size       = 5
    instance_types = ["t3.large", "t3a.large"]
    capacity_type  = "SPOT"
  }
}

# RDS Configuration
rds_engine_version    = "15.3"
rds_instance_class    = "db.t3.large"
rds_allocated_storage = 100
database_name         = "spywatcher"
database_username     = "spywatcher"

# Redis Configuration
redis_node_type      = "cache.t3.medium"
redis_num_cache_nodes = 2

# SSL Certificate
# Replace with actual certificate ARN after creating in ACM
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Additional Tags
tags = {
  Terraform   = "true"
  Environment = "production"
  Project     = "spywatcher"
  CostCenter  = "engineering"
}
