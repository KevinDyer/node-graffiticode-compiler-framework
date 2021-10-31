const AWS = require('AWS-sdk');
const Dockerode = require('dockerode');

const region = 'us-west-2';
const ecr = new AWS.ECR({ apiVersion: '2015-09-21', region });
const docker = new Dockerode();

const getAwsAccountId = async ({ }) => {
  await new Promise((resolve, reject) =>
    AWS.config.getCredentials((err, credentials) =>
      err ? reject(err) : resolve(credentials)));

  const sts = new AWS.STS();
  const { Account: awsAccountId } = await sts.getCallerIdentity({}).promise();

  return awsAccountId;
};

const getRegistryDetails = async ({ repo, registryIds }) => {
  const { authorizationData } = await ecr.getAuthorizationToken({ registryIds }).promise();
  if (authorizationData.length > 0) {
    const authorizationToken = authorizationData[0].authorizationToken;
    const [username, password] = Buffer.from(authorizationToken, 'base64').toString().split(':');
    const registryDetails = {
      username,
      password,
      serveraddress: `https://${repo}/`,
    };
    return registryDetails;
  }
  return null;
};

const maybeCreateRespository = async ({ registryId, repositoryName }) => {
  try {
    await ecr.createRepository({ registryId, repositoryName }).promise();
  } catch (err) {
    if (err.code !== 'RepositoryAlreadyExistsException') {
      throw err;
    }
  }
};

const run = async ({ lang = 'l0', region = 'us-west-2' }) => {
  const awsAccountId = await getAwsAccountId({});

  const imageName = `graffiticode-${lang}`;
  const repo = `${awsAccountId}.dkr.ecr.${region}.amazonaws.com`;
  const repositoryUri = `${repo}/${imageName}`;

  await maybeCreateRespository({ registryId: awsAccountId, repositoryName: imageName });
  const registryDetails = await getRegistryDetails({ repo, registryIds: [awsAccountId] });

  const stream = await docker.buildImage({
    context: __dirname, src: ['Dockerfile']
  }, { t: repositoryUri });
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
  });
  const image = docker.getImage(repositoryUri);
  await new Promise((resolve, reject) => {
    image.push({ tag: 'latest', authconfig: registryDetails }, (err, stream) => {
      if (err) {
        reject(err);
      } else {
        docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
      }
    });
  });
};

run({}).catch(console.error);
