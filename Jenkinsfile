final def String ECR_REGISTRY = '542640492856.dkr.ecr.us-west-2.amazonaws.com'
final def String ECR_REPO     = 'ecs-cleaner'
final def String ECR_REGION   = 'us-west-2'  // For the above repo, not for the clean target

def doCheckout() {
    stage 'checkout'
    checkout scm

    sh 'env | grep master'
}

def doBuild(tag) {
    stage 'build'
    sh "docker build -t ${tag} ."
}

def doPush(tag) {
    stage 'push'
    sh './ci/ecr-login'
    sh "docker push $tag"
}

def String readIn(command, tmpfile) {
    sh(command + ' > ' + tmpfile)
    return readFile(tmpfile).trim()
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

                    doCheckout()

                    def commit = readIn('git rev-parse --short HEAD', 'GIT_COMMIT');
                    def branch = readIn('git rev-parse --abbrev-ref HEAD', 'GIT_BRANCH');

                    withEnv([
                            "GIT_COMMIT=${commit}",
                            "GIT_BRANCH=${branch}",
                            "AWS_DEFAULT_REGION=${ECR_REGION}"
                    ]) {
                        def tag = "${ECR_REGISTRY}/${ECR_REPO}:${commit}"
                        echo "Building for ${branch}/${commit}: ${tag}"

                        doBuild(tag)
                        doPush(tag)
                    }
                }
            }
        }
    }
}
