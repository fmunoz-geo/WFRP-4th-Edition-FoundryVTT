class BrowserWfrp4e extends Application
{
  constructor(app)
  {
    super(app)

    this.filters = {
      type : {
        "ammunition" : false,
        "armour" : false,
        "career" : false,
        "container" : false,
        "critical" : false,
        "disease" : false,
        "injury" : false,
        "money" : false,
        "mutation" : false,
        "prayer" : false,
        "psychology" : false,
        "talent" : false,
        "trapping" : false,
        "skill" : false,
        "spell" : false,
        "trait" : false,
        "weapon" : false
      },
      attribute : {
        name : "",
        description: "",
      },
      dynamic : {
        careergroup : {value : "", type : ["career"], show : false},
        class : {value : "", type : ["career"], show : false},
        level : {value : "", type : ["career"], show : false},
        statusTier : {value : "", type : ["career"], show : false},
      }
    }

    this.careerGroups = [];
    this.careerClasses = [];
    this.careerTiers = [1,2,3,4]
    this.statusTiers = ["Gold", "Silver", "Brass"]
    
  }

  static get defaultOptions() 
  {
    const options = super.defaultOptions;
    options.id = "wfrp4e-browser";
    options.template = "systems/wfrp4e/templates/browser/browser.html"
    options.resizable = true;
    options.height = 900;
    options.width = 600;
    options.minimizable = true;
    options.title = "WFRP Browser"
    return options;
  }

  async _render(force = false, options = {}) {
    await super._render(force, options);

    if (options.textInputFocused)
    {
      $(this._element).find(options.textInputFocused).focus();
      $(this._element).find(options.textInputFocused)[0].selectionStart = $(this._element).find(options.textInputFocused)[0].value.length
    }
  }


  getData() {
    let data = super.getData();
    this.checkDynamicFilters();
    data.filters = this.filters;

    data.careerGroups = this.careerGroups;
    data.careerClasses = this.careerClasses
    data.careerTiers = this.careerTiers;
    data.statusTiers = this.statusTiers;

    data.items = this.applyFilter(this.items);

    return data;
  }

  async loadItems()
  {
    this.items = [];
    for (let p of game.packs)
    {
      if (p.metadata.entity == "Item")
      {
        await p.getContent().then(content => {
          for (let item of content)
          {
            if (item.type == "career")
            {
              if (!this.careerGroups.includes(item.data.data.careergroup.value))
                this.careerGroups.push(item.data.data.careergroup.value);
              if (!this.careerClasses.includes(item.data.data.class.value))
                this.careerClasses.push(item.data.data.class.value);
            }
          }
          this.careerGroups.sort((a, b) => (a > b) ? 1 : -1);
          this.careerClasses.sort((a, b) => (a > b) ? 1 : -1);
          this.items = this.items.concat(content)
        })
      }
    }
  }


  applyFilter(items)
  {
    let noItemFilter = true;
    let filteredItems = [];
    for (let filter in this.filters.type)
    {
      if (this.filters.type[filter])
      {
        filteredItems = filteredItems.concat(items.filter(i => i.data.type == filter))
        noItemFilter = false;
      }
    }

    
    if (noItemFilter)
      filteredItems = items;

    for (let filter in this.filters.attribute)
    {
      if (this.filters.attribute[filter])
      {
        switch(filter)
        {
          case "name" :
            filteredItems = filteredItems.filter(i => i.data.name.toLowerCase().includes(this.filters.attribute.name.toLowerCase()))
            break;
          case "description" :
            filteredItems = filteredItems.filter(i => i.data.data.description.value && i.data.data.description.value.toLowerCase().includes(this.filters.attribute.description.toLowerCase()))
            break;
        }
      }
    }

    for (let filter in this.filters.dynamic)
    {
      if (this.filters.dynamic[filter].show && this.filters.dynamic[filter].value)
      {
        switch(filter)
        {
          case "statusTier":
            filteredItems = filteredItems.filter(i => !i.data.data.status || (i.data.data.status && i.data.data.status.tier.toLowerCase() == this.filters.dynamic[filter].value[0].toLowerCase()))
            break;
          default:
            filteredItems = filteredItems.filter(i => !i.data.data[filter] || (i.data.data[filter] && i.data.data[filter].value.toString().toLowerCase().includes(this.filters.dynamic[filter].value.toLowerCase())))
            break;
        }
      }
    }
    
    return filteredItems.sort((a, b) => (a.data.name > b.data.name) ? 1 : -1);
  }

  checkDynamicFilters()
  {
    for (let dynamicFilter in this.filters.dynamic)
    {
      this.filters.dynamic[dynamicFilter].show = false;
      for (let typeFilter of this.filters.dynamic[dynamicFilter].type)
      {
        if (this.filters.type[typeFilter])
          this.filters.dynamic[dynamicFilter].show = true;
      }
    }
  }


  activateListeners(html)
  {
    html.on("click", ".filter", ev => {
      this.filters.type[$(ev.currentTarget).attr("data-filter")] = $(ev.currentTarget).is(":checked");
      this.render(true);
    })

    html.on("keyup", ".name-filter", ev => {
      this.filters.attribute.name = $(ev.currentTarget).val();
      this.render(true, {textInputFocused : ".name-filter"});
    })
    html.on("keyup", ".description-filter", ev => {
      this.filters.attribute.description = $(ev.currentTarget).val();
      this.render(true, {textInputFocused : ".description-filter"});
    })
    html.on("keyup change", ".dynamic-filter", ev => {
      this.filters.dynamic[$(ev.currentTarget).attr("data-filter")].value = $(ev.currentTarget).val();
      let options = {}
      if (ev.target.type == "text")
      {
        options["textInputFocused"] = `.${$(ev.currentTarget).attr("data-filter")}`
      }
      this.render(true, options);
    })
  }

}

Hooks.on("renderCompendiumDirectory", (app, html, data) => {
  if (game.user.isGM)
  {
    const button = $(`<button class="browser-btn">Browser</button>`);
    html.find(".directory-footer").append(button);

    button.click(ev => {
      game.wfrpbrowser.render(true)
    })
  }
})

Hooks.on('init', () => {
  if (!game.wfrpbrowser)
    game.wfrpbrowser = new BrowserWfrp4e();
})

Hooks.on('ready', () => {
  if (game.user.isGM)
    game.wfrpbrowser.loadItems();
})