#!/usr/bin/env python3

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
        info.append({name:elem[name] for name in ['file_name', 'width', 'height']})

# Set up Flask
from flask import Flask, request, jsonify
app = Flask(__name__)
j   = jsonify

# Hook up a route for POST /detect
@app.route('/detect', methods=['POST'])
def detect_image():
    # Fetch and validate the thresh value
    thresh = 0.5
    if 'thresh' in request.values:
        try:
            thresh = float(request.values['thresh'])
        except (ValueError, TypeError):
            return j({ 'error': 'thresh was not a float' }), 400
    if thresh < 0.0:
        return j({ 'error': '<0 threshold supplied' }), 400
    elif thresh > 1.0:
        return j({ 'error': '>1 threshhold supplied' }), 400
        
    # Fetch the image
    # NOTE: For sanity we only accept <2MB images
    if 'image' not in request.files:
        return j({ 'error': 'no image supplied' }), 400
    stream = request.files['image'].stream.read(2 * 1024 * 1024)
    # Check if theres more data to consume => input larger than 2MB
    if len(request.files['image'].stream.read(1)):
        return j({ 'error': 'input images are restricted to 2MB' }), 400
    # Try to parse the image
    image = None
    try:
        import numpy
        from io  import BytesIO
        from PIL import Image
        image = numpy.array(Image.open(BytesIO(stream)).convert('RGB'))
    except OSError as e:
        return j({ 'error': 'could not parse image' }), 400
        
    # Everything from here *should be* safe, but we'll wrap it just in case
    try:
        import cv2
        from keras_retinanet.utils.image         import preprocess_image, resize_image
        # TODO: Downscale the input?
        draw   = image.copy()
        image  = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        image  = preprocess_image(image)
        image, scale = resize_image(image)

        with graph.as_default():
            [boxes], [scores], [labels] = model.predict_on_batch(numpy.expand_dims(draw, axis=0))
        boxes /= scale

        results = []
        for box, score, label in zip(boxes, scores, labels):
            # Results are ordered by score
            if score < thresh: break
            from consts import label_map
            results.append({ 'score': float(score)
                           , 'label': label_map[label]
                           , 'box'  : [float(p) for p in box] })
        return j({ 'success': results }), 200

    except Exception as e:
        return j({ 'error': 'fatal error: {} {}'.format(type(e), e) }), 500
        # TODO: Try to reduce this?

@app.route('/info', methods=['GET'])
def get_coco_info():
    return j({ 'success': info }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
