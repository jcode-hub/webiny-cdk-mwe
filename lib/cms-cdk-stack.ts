import * as cdk from "@aws-cdk/core";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as cpla from "@aws-cdk/aws-codepipeline-actions";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as iam from "@aws-cdk/aws-iam";
import * as codecommit from "@aws-cdk/aws-codecommit";

export class CmsCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const deploymentRole = new iam.Role(this, "WebinyDeploymentRole", {
      assumedBy: new iam.ServicePrincipal("codebuild.amazonaws.com"),
    });
    deploymentRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    /**
     * @description: CodeCommit action and source artifiact
     */
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new cpla.CodeCommitSourceAction({
      branch: "master",
      actionName: "Source",
      repository: new codecommit.Repository(this, "WebinyRepo", {
        repositoryName: "webiny-cms-repository",
      }),
      output: sourceOutput,
    });

    // codebuild deploy action
    const deployCmsOutput = new codepipeline.Artifact();
    const deployCmsProject = new codebuild.PipelineProject(
      this,
      "CodeBuildProject",
      {
        projectName: "webiny-cms-deploy",
        buildSpec: codebuild.BuildSpec.fromSourceFilename("buildspec.yml"),
        role: deploymentRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        },
      }
    );

    // Build action
    const deployCmsAction = new cpla.CodeBuildAction({
      actionName: "Build",
      input: sourceOutput,
      outputs: [deployCmsOutput],
      project: deployCmsProject,
    });

    /* eslint-disable no-unused-vars */
    const pipeline = new codepipeline.Pipeline(this, "CmsDeploymentPipeline", {
      pipelineName: "webiny-cms-pipeline",
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Deploy",
          actions: [deployCmsAction],
        },
      ],
    });
    /* eslint-enable no-unused-vars */
  }
}
