var scene,cam,renderer,all_objects=[],RUNNING=true,SUN
function init(){
	scene=new THREE.Scene()
	cam=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,15000)
	cam.position.set(0,30,50)
	cam.lookAt(new THREE.Vector3(0,0,0))
	renderer=new THREE.WebGLRenderer({antialias:true})
	renderer.setSize(window.innerWidth,window.innerHeight)
	renderer.setClearColor(0x000000)
	renderer.shadowMap.enabled=true
	renderer.shadowMap.type=THREE.PCFSoftShadowMap
	document.body.appendChild(renderer.domElement)
	scene.add(new THREE.AmbientLight(0xffffff,0.2))
	SUN=new Sun()
	var g=new THREE.Mesh(new THREE.BoxGeometry(3000,.1,3000),new THREE.MeshBasicMaterial({color:0x111111}))
	g.reciveShadow=true
	scene.add(g)
	renderer.render(scene,cam)
	var c=new THREE.OrbitControls(cam,renderer.domElement)
	c.target=new THREE.Vector3(175,150,200)
	c.update()
	window.addEventListener("resize",resize,false)
	requestAnimationFrame(render)
}
function render(){
	for (var o of all_objects){
		if (o.active==false){continue}
		o.update()
	}
	renderer.render(scene,cam)
	if (RUNNING==true){requestAnimationFrame(render)}
}
function resize(){
	cam.aspect=window.innerWidth/window.innerHeight
	cam.updateProjectionMatrix()
	renderer.setSize(window.innerWidth,window.innerHeight)
}
class GameObject{
	_l(p){
		function lm(json,ths){
			var tgr=new THREE.Group(),agr={},DATA={side:THREE.DoubleSide,flatShading:true,metalness:0,roughness:1}
			for (var o of json.model){
				if (o.type=="cube"){
					var box=new THREE.BoxBufferGeometry(o.w,o.h,o.d),mat=[]
					for (var k of o.texture){
						k=json.texture[k]
						if (k.type=="color"){
							var d=Object.assign({},DATA)
							d.color=k.data
							mat.push(new THREE.MeshStandardMaterial(d))
						}
						else{
							var t=new THREE.TextureLoader().load(k.data)
							var d=Object.assign({},DATA)
							d.map=t
							mat.push(new THREE.MeshStandardMaterial(d))
						}
					}
					box=new THREE.Mesh(box,mat)
					box.position.set(o.x,o.y,o.z)
					box.rotation.set(o.rx,o.ry,o.rz)
					box.name=o.name
					box.castShadow=true
					box.reciveShadow=true
					agr[o.group]=agr[o.group]||new THREE.Group()
					agr[o.group].add(box)
				}
				else{
					var plane=new THREE.PlaneBufferGeometry(o.w,o.h),mat
					var k=json.texture[o.texture]
					if (k.type=="color"){
						var d=Object.assign({},DATA)
						d.color=k.data
						mat=new THREE.MeshStandardMaterial(d)
					}
					else{
						var t=new THREE.TextureLoader().load(k.data)
						var d=Object.assign({},DATA)
						d.map=t
						mat=new THREE.MeshStandardMaterial(d)
					}
					plane=new THREE.Mesh(plane,mat)
					plane.position.set(o.x,o.y,o.z)
					plane.rotation.set(o.rx,o.ry,o.rz)
					plane.name=o.name
					plane.castShadow=true
					plane.reciveShadow=true
					agr[o.group]=agr[o.group]||new THREE.Group()
					agr[o.group].add(plane)
				}
			}
			for (var k of Object.keys(agr)){
				var g=agr[k]
				g.name=k
				tgr.add(g)
			}
			scene.add(tgr)
			ths.object=tgr
			scene.add(ths.object)
			ths.active=true
			for (var k of ths.toDo){
				if (k[k.length-1]=="p"){
					ths.move(...k)
				}
				else{
					ths.rotate(...k)
				}
			}
		}
		fetch(p).then(data=>data.json()).then(json=>lm(json,this))
	}
	constructor(type,model){
		this.active=false
		this.type=type
		this.object=null
		this.toDo=[]
		if (this.type=="model"){
			this._l(model)
		}
		all_objects.push(this)
	}
	set_object(o){
		if (this.object!=null){return}
		this.object=o
		this.active=true
		for (var k of this.toDo){
			if (k[k.length-1]=="p"){
				this.move(...k)
			}
			else{
				this.rotate(...k)
			}
		}
		scene.add(this.object)
	}
	update(){
		//
	}
	parts(p,s){
		if (p=="ALL"){this.object.visible=s}
		if (p=="body"){return}
		for (var ki=0;ki<this.object.children.length;ki++){
			var k=this.object.children[ki]
			if (k.name==p){
				k.visible=s
				return
			}
		}
	}
	move(x,y,z,p){
		if (this.active==false){
			this.toDo.push([x,y,z,p,"p"])
			return
		}
		x=x||0
		y=y||0
		z=z||0
		if (p==true){
			this.object.position.set(x,y,z)
			return
		}
		this.object.position.x+=x
		this.object.position.y+=y
		this.object.position.z+=z
	}
	rotate(x,y,z,p){
		if (this.active==false){
			this.toDo.push([x,y,z,p,"r"])
			return
		}
		x=THREE.Math.degToRad(x)||0
		y=THREE.Math.degToRad(y)||0
		z=THREE.Math.degToRad(z)||0
		if (p==true){
			this.object.rotation.set(x,y,z)
			return
		}
		this.object.rotation.x+=x
		this.object.rotation.y+=y
		this.object.rotation.z+=z
	}
}
class Sun extends GameObject{
	create(){
		var l=new THREE.SpotLight(0xffffff,1,0,1)
		l.position.set(200,200,200)
		l.target.position.set(0,0,0)
		l.castShadow=true
		scene.add(l)
		scene.add(l.target)
		l.shadow.mapSize.width=1024
		l.shadow.mapSize.height=1024
		l.shadow.camera.near=0.5
		l.shadow.camera.far=15000
		var g=new THREE.Mesh(new THREE.BoxGeometry(20,20,20),new THREE.MeshBasicMaterial({color:0xdddd00}))
		l.add(g)
		return l
	}
	constructor(){
		super("light")
		this.set_object(this.create())
		this.rotA=0
	}
	update(){
		this.rotA+=0.3
		var a=1500,b=500
		var ang=THREE.Math.degToRad(this.rotA)
		this.move(a*Math.cos(ang),b*Math.sin(0.5*ang),a*Math.sin(ang),true)
		this.object.intensity=Math.max(2*Math.sin(0.5*ang),0)
		this.object.children[0].material.color.setHSL(this.object.intensity.map(0,2,30/360,60/360),1,0.5)
	}
}
document.addEventListener("DOMContentLoaded",init,false)
Number.prototype.map=function(as,ae,bs,be){
	return (this-as)*(be-bs)/(ae-as)+bs
}
var block=new GameObject("model","k.json")
block.rotate(0,90,0,true)
block.move(0,-50,0,true)
