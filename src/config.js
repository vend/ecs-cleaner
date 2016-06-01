function validate(config) {
  if (!config.REGION) {
    throw new Error('You must supply a REGION configuration value');
  }
}

export default () => {
  const config = {
    DEBUG: process.env.NODE_ENV === 'development',
    REGION: process.env.REGION,
  };

  validate(config);

  return config;
};
