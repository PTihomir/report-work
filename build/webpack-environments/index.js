import config from '../../config';

export default require(`./${config.env}`).default;
