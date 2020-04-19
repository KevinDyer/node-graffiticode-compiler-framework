import { buildValidateToken } from './validate-token';

describe('validate-token', () => {
  it('should return default if no token', async () => {
    // Arrange
    const lang = 'L0';
    const count = jest.fn().mockResolvedValue({});
    const postAuth = jest
      .fn()
      .mockRejectedValue(new Error('should not be called'));
    const validateToken = buildValidateToken({ lang, count, postAuth });
    const token = null;

    // Act
    const res = await validateToken({ token });

    // Assert
    expect(res.address).toEqual('guest');
    expect(res.access).toEqual('compile');
  });

  it('should call postAuth', async () => {
    // Arrange
    const lang = 'L0';
    const count = jest.fn().mockResolvedValue({});
    const postAuth = jest
      .fn()
      .mockResolvedValue({ address: 'address', access: 'access' });
    const validateToken = buildValidateToken({ lang, count, postAuth });
    const token = 'token';

    // Act
    const res = await validateToken({ token });

    // Assert
    expect(postAuth).toHaveBeenCalledWith({
      path: '/validate',
      data: {
        jwt: token,
        lang,
      },
    });
    expect(count).toHaveBeenCalledWith({ token, lang, increment: 1 });
    expect(res.address).toEqual('address');
    expect(res.access).toEqual('access');
  });

  it('should call postAuth only once', async () => {
    // Arrange
    const lang = 'L0';
    const count = jest.fn().mockResolvedValue({});
    const postAuth = jest
      .fn()
      .mockResolvedValue({ address: 'address', access: 'access' });
    const validateToken = buildValidateToken({ lang, count, postAuth });
    const token = 'token';

    // Act
    const res1 = await validateToken({ token });
    const res2 = await validateToken({ token });

    // Assert
    expect(postAuth).toHaveBeenCalledTimes(1);
    expect(postAuth).toHaveBeenNthCalledWith(1, {
      path: '/validate',
      data: {
        jwt: token,
        lang,
      },
    });
    expect(count).toHaveBeenCalledTimes(2);
    expect(count).toHaveBeenNthCalledWith(1, { token, lang, increment: 1 });
    expect(count).toHaveBeenNthCalledWith(2, { token, lang, increment: 1 });
    expect(res1.address).toEqual('address');
    expect(res1.access).toEqual('access');
    expect(res2.address).toEqual('address');
    expect(res2.access).toEqual('access');
  });
});
