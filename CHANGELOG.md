### 2018-09-27
- Preparing to merge this project with the V7 project
- Developing popup-routes (_still seems to me that a popup in essence is a page, why is there the need to define it as a popup in HTML code?_)

### 2018-09-26
- Prefixing localStorage keys with `v7.`
- Introducing pages/settings/language

### 2018-09-24
- Previously loaded investigations are loaded during startup (currently sorted by "savedAt_" of the corresponding PouchDB document)
- That's right! Adding pouchdb.find to this mix. Now it's getting interesting

### 2018-09-22
- Developing marker placement
- Changing some icons

### 2018-09-19
- Framework7 Android theming enabled 
- Full screen home screen web app enabled

### 2018-09-14
- Further developing persistence layer (`V7.objects`)
- Caching downloads (eg. v7-export) for faster reloading, struggling with PouchDB performance on iPhone 6s?
- Introducing /settings pages

### 2018-09-10
- Developing search feature (/veldoffice/onderzoeken)
- Developing photos (/veldoffice/fotos)
- Introducing /menu-fix, debug page?

### 2018-09-09
- Introducing V7 as `window.V7` global, (should be) available while initialization code of pages components executes
- Simplifying /menu, less controller code, more code to reflect state

### 2018-09-02
- `routes.js`

### 2018-08-29
- Developing server-paged-pouchdb-cached-infinite-virtual-scrolling-list-query 
- Introducing V7.objects and veldoffice/EM.query{pager}

### 2018-08-22
- Finally getting up to speed _with myf'nself_