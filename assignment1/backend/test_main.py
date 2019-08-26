import unittest
import requests
import json

# Wrapper for POST /detect
def detect(img=None, thresh=None):
    data  = {} if thresh is None else {'thresh':thresh}
    files = {} if img    is None else {'image': img}
    return requests.post('http://127.0.0.1:8080/detect', files=files, data=data)

# Wrapper for GET /info
def info():
    return requests.get('http://127.0.0.1:8080/info')

# Loads the file for the given input tag
def test_file(tag):
    with open('test_images/{}.png'.format(tag), 'rb') as fd:
        return fd.read(-1)

# Determine if an HTTP response is an error
def is_error(response):
    obj = json.loads(response.text)
    return response.status_code == 200 and 'error' in obj

# Determine if an HTTP response is successful
def is_success(response):
    obj = json.loads(response.text)
    return response.status_code == 200 and 'success' in obj

class WebTest(unittest.TestCase):
    # Thresh should be in float [0,1]
    def test_negative_thresh(self):
        from random import uniform
        for _ in range(64):
            response = detect(test_file('person'), -0.0001 - uniform(0, 3))
            self.assertTrue(is_error(response))

    # Ditto
    def test_large_thresh(self):
        from random import uniform
        for _ in range(64):
            response = detect(test_file('person'), 1.0001 + uniform(0, 3))
            self.assertTrue(is_error(response))

    # Ditto
    def test_non_float_thresh(self):
        response = detect(test_file('person'), 'string')
        self.assertTrue(is_error(response))

    # Files are required
    def test_no_file(self):
        response = detect()
        self.assertTrue(is_error(response))

    # Files should be actual images
    def test_not_image(self):
        response = detect('string')
        self.assertTrue(is_error(response))

    # Files should not be overly large
    def test_large_image(self):
        response = detect(test_file('very_large'))
        self.assertTrue(is_error(response))

    # Test against all output labels we know of
    def test_successful_requests(self):
        from consts import label_map
        correct_count = 0
        total_count   = 0
        for label in label_map.values():
            response = detect(test_file(label))
            self.assertTrue(is_success(response))
            obj             = json.loads(response.text)
            correct_count  += int(any(o['label'] == label for o in obj['success']))
            total_count    += 1
        print('correct_count={},total_count={}'.format(correct_count, total_count))

    # Make sure GET /info works as expected
    def test_info(self):
        response = info()
        self.assertTrue(is_success(response))

if __name__ == '__main__':
    unittest.main()
