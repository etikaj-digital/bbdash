	
	var bus = riot.observable();
	var g_project_types, g_projects, g_disruptions, g_organisations = [];
	var g_road = 'https://bigbuild.disruptions-app.com.au/api/types/13/?format=json';
	
	setGlobals();
	
	bus.on('sync',getData);
	
	riot.mount('*');
	bus.trigger('sync');
	
	setInterval(function(){bus.trigger('sync');},300000);
	
	
	function setGlobals(){
	
		g_project_types = localStorage['project_types']==null ? [] : JSON.parse(localStorage['project_types']);
		g_projects = localStorage['projects']==null ? [] : JSON.parse(localStorage['projects']);
		g_disruptions = localStorage['disruptions']==null ? [] : JSON.parse(localStorage['disruptions']);
		g_organisations = localStorage['organisations']==null ? [] : JSON.parse(localStorage['organisations']);	
		g_filters = localStorage['filters']==null ? {organisation:'All',project:'All',status:'All',priority:0} : JSON.parse(localStorage['filters']);

	}
	
	function getData(){
		
		bus.trigger('sync-start');
		Promise.all([getOrganisations(),getProjectTypes(), getProjects(), getDisruptions()])
		.then(function(){
			setGlobals();
			bus.trigger('sync-end');
		});	
		
	}
	
	function getOrganisations(){
	
		console.log('Getting organisations...');
		return fetch('https://bigbuild.disruptions-app.com.au/api/organisations/?format=json')
			.then(function(response) {
				return response.json();
			})
			.then(function(organisations) {
				console.log('Got organisations');
				localStorage['organisations'] = JSON.stringify(organisations);
			})
			.catch(function(error){ 
				console.log(error); 
			});	
	}
		

	function getProjects(){
		
		console.log('Getting projects...');
		return fetch('https://bigbuild.disruptions-app.com.au/api/projects/?format=json')
			.then(function(response) {
				return response.json();
			})
			.then(function(projects) {
				console.log('Got projects');
				localStorage['projects'] = JSON.stringify(projects);
			})
			.catch(function(error){ 
				console.log(error); 
			});
		
	}
		
	
	function getProjectTypes(){
		
		console.log('Getting project types...');
		return fetch('https://bigbuild.disruptions-app.com.au/api/project_types/?format=json')
			.then(function(response) {
				return response.json();
			})
			.then(function(project_types){
				console.log('Got project types',project_types);
				localStorage['project_types'] = JSON.stringify(project_types);
			})
			.catch(function(error){
				console.log('Error getting project types',error);
			});
	}
	
		
	function getDisruptions(){
		
		console.log('Getting disruptions...');
		return fetch('https://bigbuild.disruptions-app.com.au/api/disruptions/?current=True&format=json&ordering=-updated_on')
			.then(function(response) {
				return response.json();
			})
			.then(function(disruptions) {	
				console.log('Got disruptions',disruptions);
				localStorage['disruptions'] = JSON.stringify(expandDisruptions(disruptions.filter(function(d){ return d.type[0] == g_road })));
			})
			.catch(function(error){
				console.log('Error getting disruptions',error);
			});
		}
		
		
	function expandDisruptions(disruptions){	

		console.log('disruptions',disruptions);
		
		disruptions.forEach(function(d){
			let project = g_projects.filter(function(p){ return p.url == d.project });
			if (project.length>0){
				d.project_name = project[0].name;
				d.organisation = project[0].organisations[0];
			}
			if (d.project_type!=null){
				let ptype = g_project_types.filter(function(p){ return p.url == d.project_type });
				d.project_type = ptype.length==0 ? '': ptype[0].name;
			} else {
				d.project_type = '';
			}
			d.update_status = null;
			if (g_disruptions.length>0){
				let cached = g_disruptions.filter(function(cd){ return cd.id == d.id });
				if (cached.length==0){
					d.update_status = 'new';
				} else {
					if (d.updated_on != cached[0].updated_on) d.update_status = 'updated';
				}
			}
		});
		
		return disruptions;
	}