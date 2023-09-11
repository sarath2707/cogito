Congratulations on progressing to this part of the DevOps screening process.

This test will evaluate skills via a take-home project. You will find the project requirements in this directory. Please treat this project as if you are delivering it to a client.

The requirements for the test project are:

* Build, push a Docker image defined in ./src/web/Dockerfile and deploy/run the container in AWS.
* The architecture should be completely provisioned via Pulumi using Python or Javascript libraries. 
* The deployment of new code should be completely automated and deployable with no manual intervention, the application docker image should only be built and pushed if there has been source code in ./src/web. eg. When index.html is updated a new container will be published and container updated, when README.md is updated no new container is published.
* You should keep use the ./src directory as a base for your solution, it can be copied to any subdirectory you wish.
* You should be able to deploy the application to any AWS account.
