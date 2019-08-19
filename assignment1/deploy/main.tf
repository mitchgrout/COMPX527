# Set up our provider; none of this should really change
provider "aws" {
  region                  = "us-east-1"
  shared_credentials_file = "~/.aws/credentials"
}

# Create var.instance_count many EC2 instances
resource "aws_instance" "ec2_instances" {
    count = var.instance_count

    # ubuntu-xenial-16.04-amd64-server-20190605
    # TODO: Use custom AMI?
    ami           = "ami-01d9d5f6cecc31f85"
    instance_type = "t2.large"

    # Hook up SSH key and configure ports
    key_name        = aws_key_pair.deployer.key_name 
    security_groups = ["${aws_security_group.ec2_access_group.name}"]

    # General name
    tags = {
        name = "527-ec2-instance-${count.index}"
    }

    # TODO: Should we move some of the ansible bootstrapping here? e.g.
    # user_data = <<-EOF
    #             apt-get install ...
    #             EOF
}

# Create a load-balancer
resource "aws_elb" "load_balancer"{
    name               = "527-load-balancer"
    availability_zones = ["us-east-1a", "us-east-1b","us-east-1c"]
    security_groups    = ["${aws_security_group.lb_access_group.id}"]
   
    # Configure port/proto translation
    listener {
        instance_port     = var.server_port
        instance_protocol = "http"
        lb_port           = 80
        lb_protocol       = "http"
    }
   
    # Have the LB keep an eye on the instances
    health_check {
        # Healthy ~ at least 2 positive responses
        healthy_threshold   = 2

        # Unhealthy ~ at least 2 negative responses
        unhealthy_threshold = 2

        # 5s max for requests, every 10s
        timeout             = 3 
        interval            = 5
        target              = "TCP:${var.server_port}"
    }
}

# Attach our instances
resource "aws_elb_attachment" "ec2_attachment" {
    count    = var.instance_count
    elb      = "${aws_elb.load_balancer.id}"
    instance = "${aws_instance.ec2_instances[count.index].id}"
}

################################################################################

# SSH key
resource "aws_key_pair" "deployer" {
    key_name   = "527-deployer-key"
    public_key = file(var.public_key_path)
}

# Configure security groups
resource "aws_security_group" "ec2_access_group" {
    name        = "ec2_access_group"
    description = "Allow certain traffic to our EC2 instances"
    # TODO: Should we be using a VPC?

    # SSH
    ingress {
        from_port   = 22 
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = var.whitelisted_ip_blocks 
    }

    # HTTP
    ingress {
        from_port   = var.server_port
        to_port     = var.server_port
        protocol    = "tcp"
        # TODO: Can we figure out how to set cidr_blocks = [ $load_balancer ]?
        cidr_blocks = ["0.0.0.0/0"] # var.whitelisted_ip_blocks 
    }

    # Output
    egress {
        from_port   = 0 
        to_port     = 0 
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }
}

resource "aws_security_group" "lb_access_group" {
    name = "lb_access_group"
    description = "Allow HTTP traffic to our load balancer"
    
    # HTTP
    ingress {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = var.whitelisted_ip_blocks
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }
}

################################################################################

# Print out the DNS' for all running EC2 instances
output "ec2_public_dns" {
    description = "Public DNS of all instances"
    value       = ["${aws_instance.ec2_instances.*.public_dns}"]
}

# Print out the DNS for the load balancer
output "load_balancer_public_dns" {
    description = "DNS of the load balancer"
    value       = aws_elb.load_balancer.dns_name
}
