variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}


variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}


variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "paystream-cluster"
}


variable "node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.medium"
}


variable "desired_nodes" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}
