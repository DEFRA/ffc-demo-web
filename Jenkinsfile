def registry = '562955126301.dkr.ecr.eu-west-2.amazonaws.com'
def regCredsId = 'ecr:eu-west-2:ecr-user'
def kubeCredsId = 'awskubeconfig002'
def ingressServer = "ffc.aws-int.defra.cloud"
def imageName = 'ffc-demo-web'
def repoName = 'ffc-demo-web'
def branch = ''
def pr = ''
def mergedPrNo = ''
def containerTag = ''

def getMergedPrNo() {
    def mergedPrNo = sh(returnStdout: true, script: "git log --pretty=oneline --abbrev-commit -1 | sed -n 's/.*(#\\([0-9]\\+\\)).*/\\1/p'").trim()
    return mergedPrNo ? "pr$mergedPrNo" : ''
}

def getVariables(repoName) {
    def branch = BRANCH_NAME
    // use the git API to get the open PR for a branch
    // Note: This will cause issues if one branch has two open PRs
    def pr = sh(returnStdout: true, script: "curl https://api.github.com/repos/DEFRA/$repoName/pulls?state=open | jq '.[] | select(.head.ref == \"$branch\") | .number'").trim()
    def rawTag = pr == '' ? branch : "pr$pr"
    def containerTag = rawTag.replaceAll(/[^a-zA-Z0-9]/, '-').toLowerCase()
    return [branch, pr, containerTag,  getMergedPrNo()]
}

def buildTestImage(name, suffix) {
  sh 'docker image prune -f'
  // NOTE: the docker-compose file currently makes use of global $BUILD_NUMBER env vars fo image names
  sh "docker-compose -p $name-$suffix -f docker-compose.yaml -f docker-compose.test.yaml build --no-cache $name"
}

def runTests(name, suffix) {
  try {
    sh 'mkdir -p test-output'
    sh 'chmod 777 test-output'
    sh "docker-compose -p $name-$suffix -f docker-compose.yaml -f docker-compose.test.yaml up $name"

  } finally {
    sh "docker-compose -p $name-$suffix -f docker-compose.yaml -f docker-compose.test.yaml down -v"
    junit 'test-output/junit.xml'
    // clean up files created by node/ubuntu user that cannot be deleted by jenkins. Note: uses global environment variable
    sh "docker run --rm -u node --mount type=bind,source='$WORKSPACE/test-output',target=/usr/src/app/test-output $name rm -rf test-output/*"
  }
}

def pushContainerImage(registry, credentialsId, imageName, tag) {
  docker.withRegistry("https://$registry", credentialsId) {
    sh "docker-compose build --no-cache"
    sh "docker tag $imageName $registry/$imageName:$tag"
    sh "docker push $registry/$imageName:$tag"
  }
}

def deployPR(credentialsId, registry, imageName, tag, extraCommands) {
  withKubeConfig([credentialsId: credentialsId]) {
    def deploymentName = "$imageName-$tag"
    sh "kubectl get namespaces $deploymentName || kubectl create namespace $deploymentName"
    sh "helm upgrade $deploymentName --install --namespace $deploymentName --atomic ./helm/$imageName --set image=$registry/$imageName:$tag $extraCommands"
  }
}

def undeployPR(credentialsId, imageName, tag) {
  withKubeConfig([credentialsId: credentialsId]) {
    def deploymentName = "$imageName-$tag"
    sh "helm delete --purge $deploymentName || echo error removing deployment $deploymentName"
    sh "kubectl delete namespaces $deploymentName || echo error removing namespace $deploymentName"
  }
}

def publishChart(imageName) {
  // jenkins doesn't tidy up folder, remove old charts before running
  sh "rm -rf helm-charts"
  sshagent(credentials: ['helm-chart-creds']) {
    sh "git clone git@gitlab.ffc.aws-int.defra.cloud:helm/helm-charts.git"
    dir('helm-charts') {
      sh 'helm init -c'
      sh "helm package ../helm/$imageName"
      sh 'helm repo index .'
      sh 'git config --global user.email "buildserver@defra.gov.uk"'
      sh 'git config --global user.name "buildserver"'
      sh 'git checkout master'
      sh 'git add -A'
      sh "git commit -m 'update $imageName helm chart from build job'"
      sh 'git push'
    }
  }
}
node {
  checkout scm
  stage('Set branch, PR, and containerTag variables') {
    (branch, pr, containerTag, mergedPrNo) = getVariables(repoName)
    if (pr ) {
      sh "echo Building $pr"
    } else if (branch == "master") {
      sh "echo Building master branch"
    } else {
      currentBuild.result = 'ABORTED'
      error('Build aborted - not a PR or a master branch')
    }
  }
  stage('Build test image') {
    buildTestImage(imageName, BUILD_NUMBER)
  }
  stage('Run tests') {
    runTests(imageName, BUILD_NUMBER)
  }
  // note: there should be a `build production image` step here,
  // but the docker file is currently not set up to create a production only image
  stage('Push container image') {
    pushContainerImage(registry, regCredsId, imageName, containerTag)
  }
  if (pr != '') {
    stage('Helm install') {
      withCredentials([
          string(credentialsId: 'albTags', variable: 'albTags'),
          string(credentialsId: 'albSecurityGroups', variable: 'albSecurityGroups'),
          string(credentialsId: 'albArn', variable: 'albArn')
        ]) {
        def extraCommands = "--values ./helm/ffc-demo-web/jenkins-aws.yaml --set name=ffc-demo-$containerTag,ingress.server=$ingressServer,ingress.endpoint=ffc-demo-$containerTag,ingress.alb.tags=\"$albTags\",ingress.alb.arn=\"$albArn\",ingress.alb.securityGroups=\"$albSecurityGroups\""
        deployPR(kubeCredsId, registry, imageName, containerTag, extraCommands)
        echo "Build available for review at https://ffc-demo-$containerTag.$ingressServer"
      }
    }
  }
  if (pr == '') {
    stage('Publish chart') {
      publishChart(imageName)
    }
  }
  if (mergedPrNo != '') {
    stage('Remove merged PR') {
      sh "echo removing deployment for PR $mergedPrNo"
      undeployPR(kubeCredsId, imageName, mergedPrNo)
    }
  }
}

