const Datemath = require('@elastic/datemath');

class Combinator {
  constructor(variables) {
    const names = Object.keys(variables);
    this.generators = [];
    this.index = 0;

    names.forEach(name => {
      switch (variables[name].type) {
        case 'timestamp':
          this.generators.push(new Timestamp(name, variables[name].params));
          break;
        case 'counter':
          this.generators.push(new Counter(name, variables[name].params));
          break;
        case 'list':
          this.generators.push(new List(name, variables[name].params));
          break;
        default:
          console.log('Variable ' + name +
                      ' of unknown variable type '+ variables[name].type +
                      ', ignoring.');
      }
    })
  }

  hasNext() {
    for (let i = 0; i < this.generators.length; i++) {
      if (this.generators[i].hasNext()) {
        return true;
      }
    }
    return false;
  }

  getCurrent() {
    const result = {};
    this.generators.forEach(gen => {
      result[gen.name] = gen.getCurrent();
    });
    return result;
  }

  next() {
    for (let i = 0; i < this.generators.length; i++) {
      if (this.generators[i].hasNext()) {
        this.generators[i].next();
        for (let j = 0; j < i; j++) {
          this.generators[j].reset()
        }
        break;
      }
    }
  }

  reset() {
    this.generators.forEach(gen => gen.reset());
  }
}

class Timestamp {
  constructor(name, params) {
    this.name = name;
    this.start = Datemath.parse(params.start);
    this.current = this.start.clone();
    this.end = Datemath.parse(params.end, { roundUp: true });
    this.interval = params.interval;
    this.format = params.format || 'Y-MM-DDTHH:mm:ss.sssZ';
  }

  hasNext() {
    return this.current.clone().add(this.interval, 's').isBefore(this.end);
  }

  getCurrent() {
    return this.current.format(this.format);
  }

  next() {
    this.current.add(this.interval, 's');
  }

  reset() {
    this.current = this.start.clone();
  }


}

class Counter {
  constructor(name, params) {
    this.name = name;
    this.start = params.start;
    this.counter = params.start;
    this.end = params.end;
  }

  hasNext() {
    return this.counter < this.end;
  }

  getCurrent() {
    return this.counter;
  }

  next() {
    this.counter += 1;
  }

  reset() {
    this.counter = this.start;
  }
}

class List {
  constructor(name, params) {
    this.name = name;
    this.list = params.values;
    this.index = 0;
  }

  hasNext() {
    return this.index < this.list.length - 1;
  }

  getCurrent() {
    return this.list[this.index]
  }

  next() {
    this.index += 1;
  }

  reset() {
    this.index = 0;
  }
}

module.exports = Combinator;
