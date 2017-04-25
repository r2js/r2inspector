const is = require('is_js');
const dot = require('dotty');
const _ = require('underscore');

const getOptional = (options, obj) => {
  let optional;
  if (is.boolean(options.required)) {
    optional = !options.required;
  } else if (is.boolean(options.optional)) {
    optional = options.optional;
  } else {
    optional = true;
  }

  Object.assign(obj, { optional });
  if (!optional) {
    Object.assign(obj, { $notEmpty: true });
  }
};

const getObjectId = (type, options, obj) => {
  if (type === 'objectid') {
    Object.assign(obj, {
      type: 'string',
      $objectId: true,
      ref: options.ref,
    });
  }
};

const getAllowHtml = (type, field, options, obj) => {
  if (type === 'string' &&
      !options.allowHtml &&
      !field.enumValidator) {
    Object.assign(obj, { $cleanHtml: true });
  }
};

const getPattern = (type, options, obj) => {
  const match = options.match;
  const pattern = options.pattern;

  if (match) {
    try {
      new RegExp(match); // eslint-disable-line
      Object.assign(obj, { pattern: match });
    } catch (e) {
      Object.assign(options, { match: undefined });
    }
  } else if (pattern && type === 'string') {
    // pattern string alanlarda kullanılabiliyor
    Object.assign(obj, { pattern });
  }
};

const getArrOpts = (options, props) => {
  if (options.arrOpts) {
    Object.assign(props, options.arrOpts);
  }

  if (!options.arrOpts || typeof options.arrOpts.optional === 'undefined') {
    Object.assign(props, { optional: true });
  }
};

const getValidators = (type, options, obj) => {
  const {
    minLength, maxLength, exactLength, min, max, lt, lte, gt, gte, ne,
  } = options;

  if (type === 'string' || type === 'array') {
    Object.assign(obj, _.pick({
      minLength, maxLength, exactLength,
    }, _.identity));
  }

  // number properties
  if (type === 'number') {
    Object.assign(obj, _.pick({
      min, max, lt, lte, gt, gte, ne,
    }, _.identity));
  }

  // equal
  if (['array', 'string', 'number', 'boolean'].includes(type)) {
    if (options.enum) {
      Object.assign(obj, { eq: options.enum });
    } else if (options.eq) {
      Object.assign(obj, { eq: options.eq });
    }
  }

  // default value
  if (typeof options.default !== 'undefined') {
    Object.assign(obj, { def: options.default });
  }

  // settings
  if (typeof options.settings !== 'undefined') {
    Object.assign(obj, { settings: options.settings });
  }
};

const process = (paths, obj) => {
  _.each(paths, (field, name) => {
    if (name.startsWith('_')) {
      return false;
    }

    if (field.schema) {
      const arrOpts = {
        type: 'array',
        items: {
          type: 'object',
          strict: true,
          properties: {},
        },
      };

      getArrOpts(field.options, arrOpts);
      _.extend(obj, { [name]: arrOpts });
      return process(
        field.schema.paths,
        obj[name].items.properties);
    }

    const type = field.instance.toLowerCase();
    const props = { type };

    let arrType;
    let options;
    if (type === 'array') {
      arrType = field.caster.instance.toLowerCase();
      props.type = 'array';
      props.items = { type: arrType };
      options = Object.assign(field.caster.options, field.options);
      getArrOpts(options, props);
    }

    const getType = arrType || type;
    const getOpts = options || field.options;
    const getProps = props.items || props;
    getOptional(getOpts, getProps);
    getObjectId(getType, getOpts, getProps);
    getAllowHtml(getType, field, getOpts, getProps);
    getPattern(getType, getOpts, getProps);
    getValidators(getType, getOpts, getProps);

    if (name.includes('.')) {
      const nameArr = name.split('.');
      if (!obj[nameArr[0]]) {
        dot.put(obj, nameArr[0], {
          type: 'object',
          strict: true,
          optional: true,
          properties: {},
        });
      }
      dot.put(obj, `${nameArr[0]}.properties.${nameArr[1]}`, getProps);
    }

    return Object.assign(obj, { [name]: props });
  });
};

module.exports = function Inspector() {
  return (mongoose, modelName) => {
    const model = mongoose.model(modelName);

    if (!model.inspector) {
      const obj = {
        type: 'object',
        strict: false,
        optional: false,
        properties: {},
      };

      process(model.schema.paths, obj.properties);
      model.inspector = obj;
    }
  };
};
