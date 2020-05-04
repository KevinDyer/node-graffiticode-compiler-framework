// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
