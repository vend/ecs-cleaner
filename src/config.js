function validate(config) {
  if (!config.REGION) {
    throw new Error('You must supply a REGION configuration value');
  }
}

export default (argv) => {
  /**
   * @namespace runtimeConfig
   * @type {{REGION: *, VERBOSE: boolean, MARK_INACTIVE: boolean}}
   */
  const config = {
    REGION: argv.region,
    VERBOSE: argv.verbose,
    MARK_INACTIVE: !!argv['mark-inactive'],
  };

  validate(config);

  return config;
};
