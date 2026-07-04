# ── IAM: EKS Cluster Role ────────────────────────────────────────────
resource "aws_iam_role" "eks_cluster" {
  name = "paystream-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}


resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}


# ── IAM: EKS Node Group Role ──────────────────────────────────────────
resource "aws_iam_role" "eks_nodes" {
  name = "paystream-eks-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}


resource "aws_iam_role_policy_attachment" "eks_worker_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}


resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}


# BUG-03: AmazonEC2ContainerRegistryReadOnly is NOT attached to the node role.
# Without this, EKS worker nodes cannot pull images from ECR.
# All pods will fail with: ImagePullBackOff / "unauthorized: authentication required"
# Fix: add the missing policy attachment — see Solutions section.


# ── EKS Cluster ───────────────────────────────────────────────────────
resource "aws_eks_cluster" "paystream" {
  name     = var.cluster_name
  version  = "1.34"
  role_arn = aws_iam_role.eks_cluster.arn


  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_public_access  = true
    endpoint_private_access = true
  }


  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_iam_role_policy_attachment" "eks_ecr_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}



# ── EKS Node Group ────────────────────────────────────────────────────
resource "aws_eks_node_group" "paystream" {
  cluster_name    = aws_eks_cluster.paystream.name
  node_group_name = "paystream-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.node_instance_type]


  scaling_config {
    desired_size = var.desired_nodes
    min_size     = 1
    max_size     = 4
  }


  update_config { max_unavailable = 1 }


  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_policy,
  ]
}
