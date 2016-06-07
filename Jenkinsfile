node('trusty && vendci') {
    wrap([$class: 'AnsiColorBuildWrapper']) {
        echo "\u001B[31mI'm Red\u001B[0m Now not"

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
                        doBuild()
                    }
                }
            }
        }
    }
}

def doCheckout() {
    stage 'checkout'
    checkout scm

    sh('git rev-parse HEAD > GIT_COMMIT')
    return readFile('GIT_COMMIT')
}

def doBuild() {
    sh 'docker build -t $GIT_COMMIT .'
}
