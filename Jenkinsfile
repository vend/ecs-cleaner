final def String ECR_REGISTRY = '542640492856.dkr.ecr.us-west-2.amazonaws.com'
final def String ECR_REPO     = 'ecs-cleaner'

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

                    withEnv(["GIT_COMMIT=${commit}", "GIT_BRANCH=${branch}"]) {
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

def doCheckout() {
    stage 'checkout'
    checkout scm
}

def String readIn(command, tmpfile) {
    sh(command + ' > ' + tmpfile)
    return readFile(tmpfile).trim()
}

def doBuild(tag) {
    stage 'build'
    echo "WTF . . . ."
    echo "set +x && docker build -t ${tag} . . . .  #wtf "
    sh "set +x && docker build -t ${tag} . . . .  #wtf "
}

def doPush(tag) {
    stage 'push'
    sh 'eval $(aws ecr get-login)'
    sh "docker push $tag"
}
