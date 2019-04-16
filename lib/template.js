class Template {
  constructor(templates) {
    this.templatesAsStrings = [];
    templates.forEach(t => {
      this.templatesAsStrings.push(JSON.stringify(t));
    });
  }

  fill(variables) {
    const keys = Object.keys(variables);
    return this.templatesAsStrings.map(t => {
      return keys.reduce((doc, key) =>
        this.format(variables, key, doc), t);
    }).map(JSON.parse);
  }

  format(variables, name, string) {
    const rex = new RegExp(`##${name}##`, 'g');
    return string.replace(rex, variables[name]);

  }
}

module.exports = Template;
