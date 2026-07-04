data "aws_caller_identity" "current" {}

data "tls_certificate" "eks" {

  url = aws_eks_cluster.paystream.identity[0].oidc[0].issuer

}

resource "aws_iam_openid_connect_provider" "eks" {

  url = aws_eks_cluster.paystream.identity[0].oidc[0].issuer

  client_id_list = [

    "sts.amazonaws.com"

  ]

  thumbprint_list = [

    data.tls_certificate.eks.certificates[0].sha1_fingerprint

  ]

}

resource "aws_iam_policy" "aws_load_balancer_controller" {

  name = "AWSLoadBalancerControllerIAMPolicy"

  policy = file("${path.module}/iam-policy.json")

}


resource "aws_iam_role" "aws_load_balancer_controller" {

  name = "paystream-aws-load-balancer-controller"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [{

      Effect = "Allow"

      Principal = {

        Federated = aws_iam_openid_connect_provider.eks.arn

      }

      Action = "sts:AssumeRoleWithWebIdentity"

      Condition = {

        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"

        }

      }

    }]

  })

}

resource "aws_iam_role_policy_attachment" "alb_controller" {

  role = aws_iam_role.aws_load_balancer_controller.name

  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn

}

resource "kubernetes_service_account" "aws_load_balancer_controller" {

  metadata {

    name = "aws-load-balancer-controller"

    namespace = "kube-system"

    annotations = {

      "eks.amazonaws.com/role-arn" = aws_iam_role.aws_load_balancer_controller.arn

    }

  }

}
