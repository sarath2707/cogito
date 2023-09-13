const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

const repository = new aws.ecr.Repository("my-ecr-repo");

const image = pulumi.all([repository.repositoryUrl, repository.name]).apply(([url, name]) => {
    return `${url}/${name}:latest`;
});

const taskDefinition = new aws.ecs.TaskDefinition("my-task-definition", {
    family: "my-ecs-task",
    containerDefinitions: JSON.stringify([
        {
            name: "my-container",
            image: image,
            memory: 512,
            cpu: 256,
            essential: true,
            portMappings: [
                {
                    containerPort: 80,
                    hostPort: 80,
                },
            ],
        },
    ]),
});

const cluster = new aws.ecs.Cluster("my-ecs-cluster");

const service = new aws.ecs.Service("my-ecs-service", {
    cluster: cluster.name,
    taskDefinition: taskDefinition.arn,
   desiredCount: 1,
    launchType: "FARGATE",
    networkConfiguration: {
        assignPublicIp: true,
        subnets: subnets,
       securityGroups: aws.ec2.getSecurityGroups().then(result => result.ids), // Modify this to your security group ID
    },
    loadBalancer: {
       targetGroupArn: aws.lb.getTargetGroup().then(result => result.arn),
        containerName: "my-container",
        containerPort: 80,
    },
});

// Set up S3 event trigger to listen for changes in ./src/web
const bucket = new aws.s3.Bucket("my-s3-bucket");
const lambda = new aws.lambda.Function("my-lambda-function", {
    runtime: "nodejs14.x",
    handler: "index.handler",
    role: aws.iam.getRole({ name: "my-lambda-role" }).then(result => result.name),
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda"),
    }),
    environment: {
        BUCKET_NAME: bucket.bucket,
    },
});

const bucketNotification = new aws.s3.BucketNotification("my-bucket-notification", {
    bucket: bucket.bucket,
    lambdaFunctions: [
        {
            events: ["s3:ObjectCreated:*"],
            lambdaFunctionArn: lambda.arn,
            filterPrefix: "src/web/",
        },
    ],
});
// using the codebuild to tigger the builds
const buildProject = new aws.codebuild.Project("my-codebuild-project", {
    source: {
        type: "CODEPIPELINE",
    },
    artifacts: {
        type: "NO_ARTIFACTS",
    },
    environment: {
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:4.0",
        type: "LINUX_CONTAINER",
    },
    serviceRole: aws.iam.Role.arn,
    environmentVariables: [
        {
            name: "REPOSITORY_URI",
            value: repository.repositoryUrl,
            type: "PLAINTEXT",
        },
    ],
});


// Assuming you have an array of subnet IDs
//const subnetIds = [
//  "subnet-01eddc08da5e0d6c4",
//  "subnet-0445191232253eab8", // Add your actual subnet IDs here
//];

//const filters = {
//  Name: "availability-zone",
//  Values: ["eu-east-1a", "eu-east-1b" ],
//};

//const networkConfiguration = {
//   assignPublicIp: true,
//    subnets: subnetIds,
//    securityGroups: ["sg-0a31ac6bdb4c8e05d"]
//};


exports.ecrRepositoryUrl = repository.repositoryUrl;

