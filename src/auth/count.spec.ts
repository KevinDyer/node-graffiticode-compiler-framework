import { buildCount } from './count';

describe('count', () => {
  it('should call postAuth', async () => {
    // Arrange
    const postAuth = jest.fn().mockResolvedValue({});
    const count = buildCount({ postAuth });
    const token = 'token';
    const lang = 'L0';
    const increment = 1;

    // Act
    await count({ token, lang, increment });

    // Assert
    expect(postAuth).toHaveBeenCalledWith({
      path: '/count',
      data: {
        jwt: token,
        lang,
        count: increment,
      },
    });
  });
  it('should throw if increment is less than one', async () => {
    // Arrange
    const postAuth = jest.fn().mockResolvedValue({});
    const count = buildCount({ postAuth });
    const token = 'token';
    const lang = 'L0';
    const increment = 0;

    // Act
    await expect(count({ token, lang, increment })).rejects.toThrow(
      'increment must be greater than zero'
    );

    // Assert
  });
});
