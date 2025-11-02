# Spywatcher Infrastructure as Code

This directory contains Terraform configurations for deploying Spywatcher infrastructure on AWS.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.5.0
- kubectl
- Helm (optional)

## Infrastructure Components

### Modules

- **VPC**: Virtual Private Cloud with public, private, and database subnets
- **EKS**: Elastic Kubernetes Service cluster
- **RDS**: PostgreSQL database
- **Redis**: ElastiCache Redis cluster
- **ALB**: Application Load Balancer with WAF

### Directory Structure

```
terraform/
├── main.tf                 # Root module configuration
├── variables.tf            # Root module variables
├── outputs.tf              # Root module outputs
├── modules/                # Reusable modules
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   ├── redis/
│   └── alb/
└── environments/           # Environment-specific configurations
    ├── production/
    │   └── terraform.tfvars
    └── staging/
        └── terraform.tfvars
```

## Quick Start

### 1. Configure Backend

First, create an S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket spywatcher-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket spywatcher-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Review and Customize

Edit the appropriate `terraform.tfvars` file:

```bash
# For production
vim environments/production/terraform.tfvars

# For staging
vim environments/staging/terraform.tfvars
```

Key configurations to update:
- `certificate_arn`: SSL certificate ARN from AWS Certificate Manager
- VPC CIDR blocks (if needed)
- Instance types and sizes
- Database credentials (use environment variables or AWS Secrets Manager)

### 4. Plan Infrastructure

```bash
# Production
terraform plan -var-file="environments/production/terraform.tfvars"

# Staging
terraform plan -var-file="environments/staging/terraform.tfvars"
```

### 5. Apply Infrastructure

```bash
# Production
terraform apply -var-file="environments/production/terraform.tfvars"

# Staging
terraform apply -var-file="environments/staging/terraform.tfvars"
```

This will create:
- VPC with NAT gateways
- EKS cluster with node groups
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- Application Load Balancer
- Security groups and IAM roles

### 6. Configure kubectl

After infrastructure is created:

```bash
# Get the cluster name from outputs
terraform output eks_cluster_name

# Configure kubectl
aws eks update-kubeconfig \
  --name $(terraform output -raw eks_cluster_name) \
  --region us-east-1

# Verify connection
kubectl cluster-info
kubectl get nodes
```

## Outputs

After applying, Terraform will output important values:

```bash
# View all outputs
terraform output

# View specific output
terraform output rds_endpoint
terraform output eks_cluster_endpoint
```

## Secrets Management

### Database Password

The RDS password is auto-generated and stored in AWS Secrets Manager:

```bash
# Retrieve database password
aws secretsmanager get-secret-value \
  --secret-id spywatcher-production-db-password \
  --query SecretString \
  --output text
```

### Redis Auth Token

Redis authentication token is also in Secrets Manager:

```bash
# Retrieve Redis auth token
aws secretsmanager get-secret-value \
  --secret-id spywatcher-production-auth-token \
  --query SecretString \
  --output text
```

## Updating Infrastructure

```bash
# Make changes to .tf files or terraform.tfvars

# Plan changes
terraform plan -var-file="environments/production/terraform.tfvars"

# Apply changes
terraform apply -var-file="environments/production/terraform.tfvars"
```

## Destroying Infrastructure

⚠️ **WARNING**: This will destroy all resources. Make sure you have backups!

```bash
# Destroy infrastructure
terraform destroy -var-file="environments/production/terraform.tfvars"
```

## Module Documentation

### VPC Module

Creates a VPC with:
- 3 availability zones
- Public, private, and database subnets
- NAT gateways for private subnet internet access
- VPC Flow Logs

### EKS Module

Creates an EKS cluster with:
- Managed node groups
- OIDC provider for IRSA
- Essential add-ons (VPC CNI, CoreDNS, kube-proxy)
- Security groups

### RDS Module

Creates a PostgreSQL database with:
- Encryption at rest
- Automated backups
- Multi-AZ deployment (production)
- Performance Insights
- CloudWatch alarms

### Redis Module

Creates an ElastiCache Redis cluster with:
- Encryption in transit and at rest
- Authentication token
- Automatic failover (if multi-node)
- CloudWatch alarms

### ALB Module

Creates an Application Load Balancer with:
- HTTPS termination
- HTTP to HTTPS redirect
- WAF with rate limiting
- AWS Managed Rules

## Cost Optimization

### Development/Testing

For cost savings in non-production:
- Use smaller instance types
- Single-AZ deployments
- Spot instances for EKS nodes
- Reduce backup retention periods

### Production

- Use Reserved Instances for steady-state workload
- Enable auto-scaling
- Right-size instances based on metrics
- Use S3 lifecycle policies for backups

## Monitoring

### CloudWatch Alarms

The modules create CloudWatch alarms for:
- RDS CPU utilization
- RDS storage space
- Redis CPU utilization
- Redis memory usage

Configure SNS topics for notifications:

```bash
# Create SNS topic
aws sns create-topic --name spywatcher-alerts

# Subscribe to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:spywatcher-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Troubleshooting

### State Lock Issues

If you encounter state lock errors:

```bash
# Force unlock (use carefully)
terraform force-unlock <LOCK_ID>
```

### EKS Access Issues

If you can't access the cluster:

```bash
# Ensure your AWS credentials are correct
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --name <cluster-name> --region us-east-1

# Check IAM authentication
kubectl auth can-i get pods --all-namespaces
```

### RDS Connection Issues

```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connection from EKS node
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h <rds-endpoint> -U spywatcher -d spywatcher
```

## Security Best Practices

1. **Never commit secrets**: Use AWS Secrets Manager or environment variables
2. **Enable MFA**: For AWS account access
3. **Use IAM roles**: Instead of access keys where possible
4. **Regular updates**: Keep Terraform and providers up to date
5. **Review changes**: Always review `terraform plan` output
6. **Backup state**: S3 versioning is enabled for state files
7. **Least privilege**: IAM policies follow least privilege principle

## Support

For infrastructure issues:
- Check Terraform state: `terraform show`
- Review CloudWatch logs
- Check AWS CloudTrail for API calls
- Consult AWS documentation
- Create issue in repository
