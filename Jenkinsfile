final String ECR_REGISTRY = '542640492856.dkr.ecr.us-west-2.amazonaws.com'
final String ECR_REPO     = 'ecs-cleaner'

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

                    commit = readIn('git rev-parse --short HEAD', 'GIT_COMMIT');
                    branch = readIn('git rev-parse --symbolic HEAD', 'GIT_BRANCH');

                    withEnv(["GIT_COMMIT=${commit}", "GIT_BRANCH=${branch}"]) {
                        tag = doBuild()
                        doPush(tag)
                    }
                }
            }
        }
    }
}

def doCheckout() {
    stage 'checkout'
    checkout scm
}

def String readIn(String command, String tmpfile) {
    sh(command + ' > ' + tmpfile)
    return readFile(tmpfile)
}

def String doBuild() {
    stage 'build'
    tag = "${ECR_REGISTRY}/${ECR_REPO}:\$GIT_COMMIT"
    sh "docker build -t ${tag} ."
    return tag
}

def doPush(String tag) {
    stage 'push'
    sh "docker push $tag"
}
