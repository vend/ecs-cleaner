ECR_REGISTRY = '542640492856.dkr.ecr.us-west-2.amazonaws.com'
ECR_REPO     = 'ecs-cleaner'
ECR_REGION   = 'us-west-2'  // For the above repo, not for the clean target

def doCheckout() {
    stage 'checkout'
    checkout scm

    sh('git rev-parse --short HEAD > GIT_SHORT')
    return readFile('GIT_SHORT').trim()
}

def doBuild(tag) {
    stage 'build'
    sh "docker build -t ${tag} ."
}

def doPush(String tag) {
    stage 'push'
    sh './ci/ecr-login'
    sh "docker push $tag"
}

def doPromote(tag, masterTag) {
    stage 'promote'
    sh "docker tag ${tag} ${masterTag}"
    sh "docker push ${masterTag}"
}

node('trusty && vendci') {
    wrap([$class: 'AnsiColorBuildWrapper']) {
        wrap([$class: 'TimestamperBuildWrapper']) {
            sshagent(['80e76a2a-650e-4027-a4cd-f19bb4c9a439']) {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    credentialsId: 'ecr-access',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    def commit = doCheckout()
                    def branch = env.BRANCH_NAME
                    def tag = "${ECR_REGISTRY}/${ECR_REPO}:${commit}"
                    def masterTag = "${ECR_REGISTRY}/${ECR_REPO}:master"

                    withEnv([
                            "GIT_COMMIT=${commit}",
                            "AWS_DEFAULT_REGION=${ECR_REGION}"
                    ]) {
                        echo "Building for ${branch}/${commit}: ${tag}"

                        doBuild(tag)
                        doPush(tag)

                        if (branch == 'master') {
                            doPromote(tag, masterTag)
                        }
                    }
                }
            }
        }
    }
}
