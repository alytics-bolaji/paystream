terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    tls = {
      source = "hashicorp/tls"
    }
  }
}


provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "paystream"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_eks_cluster" "paystream" {
  name = aws_eks_cluster.paystream.name
}

data "aws_eks_cluster_auth" "paystream" {
  name = aws_eks_cluster.paystream.name
}

provider "kubernetes" {
  host = data.aws_eks_cluster.paystream.endpoint
  cluster_ca_certificate = base64decode(
    data.aws_eks_cluster.paystream.certificate_authority[0].data
  )
  token = data.aws_eks_cluster_auth.paystream.token

}
