@Library('defra-library@0.0.13')
import uk.gov.defra.ffc.DefraUtils
def defraUtils = new DefraUtils()

def registry = '562955126301.dkr.ecr.eu-west-2.amazonaws.com'
def regCredsId = 'ecr:eu-west-2:ecr-user'
def kubeCredsId = 'FFCLDNEKSAWSS001_KUBECONFIG'
def ingressServer = 'ffc.aws-int.defra.cloud'
def repoName = 'ffc-demo-web'
def pr = ''
def mergedPrNo = ''
def containerTag = ''
def sonarQubeEnv = 'SonarQube'
def sonarScanner = 'SonarScanner'
def containerSrcFolder = '\\/usr\\/src\\/app'
def localSrcFolder = '.'
def lcovFile = './test-output/lcov.info'
def timeoutInMinutes = 5

node {
  checkout scm
  try {
    stage('Set GitHub status as pending'){
      defraUtils.setGithubStatusPending()
    }
    stage('Verify version incremented') {
      defraUtils.verifyPackageJsonVersionIncremented()
    }
    stage('Set PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName, defraUtils.getPackageJsonVersion())      
    }    
    stage('Set PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName, defraUtils.getPackageJsonVersion())      
    }    
    stage('Set PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName, defraUtils.getPackageJsonVersion())      
    }    
    stage('Helm lint') {
      defraUtils.lintHelm(repoName)
    }
    stage('Build test image') {
      defraUtils.buildTestImage(repoName, BUILD_NUMBER)
    }
    stage('Run tests') {
      defraUtils.runTests(repoName, BUILD_NUMBER)
    }
    stage('Create Test Report JUnit'){
      defraUtils.createTestReportJUnit()
    }
    stage('Fix absolute paths in lcov file') {
      defraUtils.replaceInFile(containerSrcFolder, localSrcFolder, lcovFile)
    }
    stage('SonarQube analysis') {
      defraUtils.analyseCode(sonarQubeEnv, sonarScanner, ['sonar.projectKey' : repoName, 'sonar.sources' : '.'])
    }
    stage("Code quality gate") {
      defraUtils.waitForQualityGateResult(timeoutInMinutes)
    }
    stage('Push container image') {
      defraUtils.buildAndPushContainerImage(regCredsId, registry, repoName, containerTag)
    }
    if (pr != '') {
      stage('Verify version incremented') {
        defraUtils.verifyPackageJsonVersionIncremented()
      }
      stage('Helm install') {
        withCredentials([
            string(credentialsId: 'albTags', variable: 'albTags'),
            string(credentialsId: 'albSecurityGroups', variable: 'albSecurityGroups'),
            string(credentialsId: 'albArn', variable: 'albArn'),
            string(credentialsId: 'ffc-demo-cookie-password', variable: 'cookiePassword')
          ]) {

          def helmValues = [
            /container.redeployOnChange="$pr-$BUILD_NUMBER"/,
            /cookiePassword="$cookiePassword"/,
            /ingress.alb.tags="$albTags"/,
            /ingress.alb.arn="$albArn"/,
            /ingress.alb.securityGroups="$albSecurityGroups"/,
            /ingress.endpoint="ffc-demo-$containerTag"/,
            /ingress.server="$ingressServer"/,
            /name="ffc-demo-$containerTag"/
          ].join(',')

          def extraCommands = [
            "--values ./helm/ffc-demo-web/jenkins-aws.yaml",
            "--set $helmValues"
          ].join(' ')

          defraUtils.deployChart(kubeCredsId, registry, repoName, containerTag, extraCommands)
          echo "Build available for review at https://ffc-demo-$containerTag.$ingressServer"
        }
      }
    }
    if (pr == '') {      
      stage('Publish chart') {
        defraUtils.publishChart(registry, repoName, containerTag)
      }
      stage('Trigger GitHub release') {
        withCredentials([
          string(credentialsId: 'ffc-demo-web-deploy-token', variable: 'gitToken') 
        ]) {
          defraUtils.triggerRelease(containerTag, repoName, containerTag, gitToken)
        }
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
        defraUtils.undeployChart(kubeCredsId, repoName, mergedPrNo)
      }
    }
    stage('Set GitHub status as success'){
      defraUtils.setGithubStatusSuccess()
    }    
  } catch(e) {
    defraUtils.setGithubStatusFailure(e.message)
    defraUtils.notifySlackBuildFailure(e.message, "#generalbuildfailures")
    throw e
  } finally {
    defraUtils.deleteTestOutput(repoName)
  }
}
