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
                    git_commit = doCheckout()

                    withEnv(["GIT_COMMIT=${git_commit}"]) {
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

    sh('git rev-parse HEAD | head -c 7 > GIT_COMMIT')
    return readFile('GIT_COMMIT')
}

def string doBuild() {
    stage 'build'
    tag = '542640492856.dkr.ecr.us-west-2.amazonaws.com/ecs-cleaner:$GIT_COMMIT'
    sh "docker build -t ${tag} ."
    return tag
}

def doPush(string tag) {
    stage 'push'
    sh "docker push $tag"
}
