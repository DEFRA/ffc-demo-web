@Library('defra-library@feature/PSD-652-node-js-pipeline')
import uk.gov.defra.ffc.DefraUtils

node {
  checkout scm
  build.setGithubStatusPending()
  build.test()
  drainpipe.test()
  pipeline.test()
  build.setGithubStatusSuccess()
}
