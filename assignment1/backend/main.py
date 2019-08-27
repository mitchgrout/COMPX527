in t#!/usr/bin/env python3

# Set up our global model
import tensorflow
from keras_retinanet.models import load_model
model = load_model('resnet50_coco_best_v2.1.0.h5', backbone_name='resnet50')

# And because Flask is multithreaded...
global graph
graph = tensorflow.get_default_graph()

# Prefetch the data for GET /info
info = []
with open('image_info_test2017.json', 'r') as fd:
    import json
    data = json.loads(fd.read(-1))['images']
    for elem in data:
        info.append({name:elem[name] for name in ['file_name', 'coco_url', 'width', 'height']})

# Set up Flask
from flask              import Flask, request, jsonify
from flask_limiter      import Limiter
from flask_limiter.util import get_remote_address
app = Flask(__name__)
lim = Limiter(app, key_func=get_remote_address)
j   = jsonify

# Custom ratelimiter
@app.errorhandler(429)
def ratelimiter(e):
    return j({ 'error': 'rate limited' }), 200

# Custom exemption for testing
def exemption():
    return "no_limiter" in request.values

# Hook up a route for POST /detect
@app.route('/detect', methods=['POST'])
@lim.limit("1/second;5/minute;25/hour", exempt_when=exemption)
def detect_image():
    # Fetch and validate the thresh value
    thresh = 0.5
    if 'thresh' in request.values:
        try:
            thresh = float(request.values['thresh'])
        except (ValueError, TypeError):
            return j({ 'error': 'thresh was not a float' })
    if thresh < 0.0:
        return j({ 'error': '<0 threshold supplied' })
    elif thresh > 1.0:
        return j({ 'error': '>1 threshhold supplied' })
        
    # Fetch the image; this can be passed either as an uploaded image OR URL
    # NOTE: For sanity we only accept <2MB images
    if 'image' in request.files:
        stream = request.files['image'].stream.read(2 * 1024 * 1024)
        if len(request.files['image'].stream.read(1)):
            return j({ 'error': 'input images are restricted to 2MB' })
    elif 'url' in request.values:
        from requests import get
        resp = get(request.values['url'], stream=True)
        by = []
        read_chunk = False
        for chunk in resp.iter_content(2 * 1024 * 1024):
            if read_chunk:
                return j({ 'error': 'input images are restricted to 2MB' })
            by += chunk
            read_chunk = True
        stream = bytes(by)
    else:
        return j({ 'error': 'no image supplied' })

   # Try to parse the image
    image = None
    try:
        import numpy
        from io  import BytesIO
        from PIL import Image
        image = numpy.array(Image.open(BytesIO(stream)).convert('RGB'))
    except OSError as e:
        return j({ 'error': 'could not parse image' })
        
    # Everything from here *should be* safe, but we'll wrap it just in case
    try:
        import cv2
        from keras_retinanet.utils.image         import preprocess_image, resize_image
        # TODO: Downscale the input?
        draw   = image.copy()
        image  = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        image  = preprocess_image(image)
        image, _ = resize_image(image)

        with graph.as_default():
            [boxes], [scores], [labels] = model.predict_on_batch(numpy.expand_dims(draw, axis=0))

        results = []
        for box, score, label in zip(boxes, scores, labels):
            # Results are ordered by score
            if score < thresh: break
            from consts import label_map
            results.append({ 'score': float(score)
                           , 'label': label_map[label]
                           , 'box'  : [float(p) for p in box] })
        return j({ 'success': results })

    except Exception as e:
        return j({ 'error': 'fatal error: {} {}'.format(type(e), e) })
        # TODO: Try to reduce this?

@app.route('/info', methods=['GET'])
@lim.limit("10/second", exempt_when=exemption)
def get_coco_info():
    # Parse the from/to params
    fr = None
    to = None
    if 'from' in request.args:
        try:
            fr = int(request.args['from'])
            fr = max(fr, 0)
        except (ValueError, TypeError):
            return j({ 'error': 'from must be an integer' })
    if 'to' in request.args:
        try:
            to = int(request.args['to'])
            to = max(to, 0)
        except (ValueError, TypeError):
            return j({ 'error': 'to must be an integer' })

    # Slice the pre-loaded info 
    return j({ 'success': info[fr:to] })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
