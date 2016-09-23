ECR_REGISTRY = '542640492856.dkr.ecr.us-west-2.amazonaws.com'
ECR_REPO     = 'ecs-cleaner'
ECR_REGION   = 'us-west-2'  // For the above repo, not for the clean target

PUBLIC_REGISTRY = 'quay.io/vend'
PUBLIC_REPO     = 'ecs-cleaner'

def doCheckout() {
    stage('checkout') {
        checkout scm
    }

    sh('git rev-parse --short HEAD > GIT_SHORT')
    return readFile('GIT_SHORT').trim()
}

def doBuild(tag) {
    stage('build') {
        sh "docker pull node:6.2"
        sh "docker build -t ${tag} ."
    }
}

def doPush(String tag) {
    stage('push') {
        sh "docker push $tag"
    }
}

def doPromote(tag, destinationTag) {
    sh "docker tag ${tag} ${destinationTag}"
    sh "docker push ${destinationTag}"
}

node('trusty && vendci') {
    wrap([$class: 'AnsiColorBuildWrapper']) {
        wrap([$class: 'TimestamperBuildWrapper']) {
            sshagent(['80e76a2a-650e-4027-a4cd-f19bb4c9a439']) {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        credentialsId: 'ecr-access',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ],
                    [
                        $class: 'UsernamePasswordMultiBinding',
                        credentialsId: 'quayio-docker-vendplusjenkins',
                        passwordVariable: 'QUAY_PASSWORD',
                        usernameVariable: 'QUAY_USERNAME'
                    ]
                ]) {
                    def commit = doCheckout()
                    def branch = env.BRANCH_NAME
                    def tag = "${ECR_REGISTRY}/${ECR_REPO}:${commit}"
                    def masterTag = "${ECR_REGISTRY}/${ECR_REPO}:master"
                    def publicTag = "${PUBLIC_REGISTRY}/${PUBLIC_REPO}:latest"

                    withEnv([
                            "GIT_COMMIT=${commit}",
                            "AWS_DEFAULT_REGION=${ECR_REGION}"
                    ]) {
                        stage('setup') {
                            ecrLogin
                            quayLogin
                        }

                        banner "Building for ${branch}/${commit}: ${tag}"

                        doBuild(tag)
                        doPush(tag)

                        if (branch == 'master') {
                            stage('promote') {
                                doPromote(tag, masterTag)
                                doPromote(tag, publicTag)
                            }
                        }
                    }
                }
            }
        }
    }
}
