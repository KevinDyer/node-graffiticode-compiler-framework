import { buildPostAuth } from './post-auth';

describe('postAuth', () => {
  it('should ...', async () => {
    // Arrange
    const authCall = jest.fn().mockResolvedValue({});
    const bent = jest.fn().mockReturnValue(authCall);
    const postAuth = buildPostAuth({
      bent,
      baseUrl: 'http://auth.example.com',
    });
    const path = '/count';
    const data = {
      jwt: 'jwt',
      lang: 'lang',
      count: 1,
    };

    // Act
    await postAuth({ path, data });

    // Assert
  });
});
