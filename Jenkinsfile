@Library('defra-library@0.0.2')
import uk.gov.defra.ffc.DefraUtils
def defraUtils = new DefraUtils()

def registry = '562955126301.dkr.ecr.eu-west-2.amazonaws.com'
def regCredsId = 'ecr:eu-west-2:ecr-user'
def kubeCredsId = 'awskubeconfig002'
def ingressServer = 'ffc.aws-int.defra.cloud'
def imageName = 'ffc-demo-web'
def repoName = 'ffc-demo-web'
def testServiceName = 'app'
def pr = ''
def mergedPrNo = ''
def containerTag = ''

node {
  checkout scm
  try {
    stage('Set PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName)
      defraUtils.setGithubStatusPending()
    }
    stage('Build test image') {
      defraUtils.buildTestImage(imageName, BUILD_NUMBER)
    }
    stage('Run tests') {
      defraUtils.runTests(testServiceName, BUILD_NUMBER)
    }
    stage('Push container image') {
      defraUtils.buildAndPushContainerImage(regCredsId, registry, imageName, containerTag)
    }
    if (pr != '') {
      stage('Helm install') {
        withCredentials([
            string(credentialsId: 'albTags', variable: 'albTags'),
            string(credentialsId: 'albSecurityGroups', variable: 'albSecurityGroups'),
            string(credentialsId: 'albArn', variable: 'albArn')
          ]) {
          def extraCommands = "--values ./helm/ffc-demo-web/jenkins-aws.yaml --set name=ffc-demo-$containerTag,ingress.server=$ingressServer,ingress.endpoint=ffc-demo-$containerTag,ingress.alb.tags=\"$albTags\",ingress.alb.arn=\"$albArn\",ingress.alb.securityGroups=\"$albSecurityGroups\""
          defraUtils.deployChart(kubeCredsId, registry, imageName, containerTag, extraCommands)
          echo "Build available for review at https://ffc-demo-$containerTag.$ingressServer"
        }
      }
    }
    if (pr == '') {
      stage('Publish chart') {
        defraUtils.publishChart(registry, imageName, containerTag)
      }
      stage('Trigger Deployment') {
        withCredentials([
          string(credentialsId: 'JenkinsDeployUrl', variable: 'jenkinsDeployUrl'),
          string(credentialsId: 'ffc-demo-web-deploy-token', variable: 'jenkinsToken')
        ]) {
          defraUtils.triggerDeploy(jenkinsDeployUrl, 'ffc-demo-web-deploy', jenkinsToken, ['chartVersion':'1.0.0'])
        }
      }
    }
    if (mergedPrNo != '') {
      stage('Remove merged PR') {
        defraUtils.undeployChart(kubeCredsId, imageName, mergedPrNo)
      }
    }
    defraUtils.setGithubStatusSuccess()
  } catch(e) {
    defraUtils.setGithubStatusFailure(e.message)
    throw e
  }
}
