var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing) {
    processing.size(400, 400);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function () { mouseIsPressed = true; };
    processing.mouseReleased = function () { mouseIsPressed = false; };

    var keyIsPressed = false;
    processing.keyPressed = function () { keyIsPressed = true; };
    processing.keyReleased = function () { keyIsPressed = false; };

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
        rotateFn(processing.radians(angle));
    };

    with (processing) {
     

/*Free level Editor at your disposal
You can use this for your platformers, goto line 218 to add your images
Note : Press a key while pressing select symbol
Left click to remove object right click to add object,

Arrow keys for camera control*/

//Use this for level size!
var LEVEL_WIDTH = 20,
    LEVEL_HEIGHT = 20;
    
var mouse = {
    xPos : mouseX,
    yPos : mouseY,
};

var keys = [];
keyPressed = function()
{
    keys[keyCode] = true;
};
keyReleased = function()
{
    keys[keyCode] = false;
};

var IsPointInsideRect = function(Point, obj)
{
    return (Point.xPos > obj.xPos && 
            Point.xPos < obj.xPos + obj.width) &&
           (Point.yPos > obj.yPos && 
            Point.yPos < obj.yPos + obj.height);   
};
var getPosOnGrid = function(Point, grid)
{
    return {
        xPos : constrain(
            ceil((Point.xPos - ((grid.gridSize / 2) + grid.xPos)) / grid.gridSize), 
            0, 
            grid.length - 1),
        yPos : constrain(
            ceil((Point.yPos - ((grid.gridSize) + grid.yPos)) / grid.gridSize),
            0,
            grid[0].length - 1),
    };
};
var createArray = function(Obj)
{
    var array = [];
    array.refs = {};
    array.usingRefs = false;
    array.addObj = function(config)
    {
        if(this.usingRefs)
        {
            this.refs[config.name || 0] = this.length;
        }
        this.push(new Obj(config));
    };
    array.getObj = function(name)
    {
        if(this.refs[name] !== undefined &&
        this[this.refs[name]] !== undefined)
        {
            return this[this.refs[name]];
        }else{
            println("Error referencing obj '" + name + "'.");
            return createArray(Obj);    
        }
    };
    array.removeObj = function(name)
    {
        this.splice(this.getObj(name), 1);
        this.refs[name] = undefined;
    };
    array.draw = function() 
    {
        for(var i = 0; i < this.length; i++)
        {
            this[i].draw();   
        }
    };
    array.update = function() 
    {
        for(var i = 0; i < this.length; i++)
        {
            this[i].update();  
            if(this[i].delete !== undefined && this[i].delete)
            {
                this.splice(i, 1);
            }
        }
    };
    array.clear = function()
    {
        this.splice(0, this.length);  
        this.refs = {};
    };
    return array;
};

var Camera = function(xPos, yPos, Width, Height)
{
    this.xPos = xPos;
    this.yPos = yPos;
    this.viewXPos = this.xPos;
    this.viewYPos = this.yPos;
    this.width = Width;
    this.height = Height;
    this.halfWidth = this.width/2;
    this.halfHeight = this.height/2;
    
    this.xAreaOffSet = 1;
    this.yAreaOffSet = 1;
    
    this.view = function(obj, grid)
    {
        this.viewXPos = obj.xPos + obj.width/2;
        this.viewYPos = obj.yPos + obj.height/2;
        
        this.viewXPos = constrain(
            this.viewXPos, 
            this.halfWidth - this.xAreaOffSet, 
            grid.width - this.halfWidth + this.xAreaOffSet);
        this.viewYPos = constrain(
            this.viewYPos, 
            this.halfHeight - this.yAreaOffSet, 
            grid.height - this.halfHeight + this.yAreaOffSet);
        
        translate(this.xPos, this.yPos);
        
        if(grid.width >= this.width)
        {
            translate(this.halfWidth - this.viewXPos, 0);
        }
        if(grid.height >= this.height)
        {
            translate(0, this.halfHeight - this.viewYPos);
        }
    };
    
    this.update = function(grid)
    {
        var xPos = (this.viewXPos - this.halfWidth);
        var yPos = (this.viewYPos - this.halfHeight);
        this.upperLeft = getPosOnGrid({
            xPos : xPos,
            yPos : yPos,
        }, grid);
        this.lowerRight = getPosOnGrid({
            xPos : xPos + this.width,
            yPos : yPos + this.height,
        }, grid);
    };
};
var cam = new Camera(0, 0, width, height);

var Viewer = function(xPos, yPos, Width, Height)
{
    this.xPos = xPos;
    this.yPos = yPos;
    this.width = Width || 10;
    this.height = Height || 10;
    
    this.speed = 5;
    
    this.update = function(grid)
    {
        if(keys[LEFT] || keys[65])
        {
            this.xPos -= this.speed;
        }
        if(keys[RIGHT] || keys[68])
        {
            this.xPos += this.speed;
        }
        if(keys[UP] || keys[87])
        {
            this.yPos -= this.speed;
        }
        if(keys[DOWN] || keys[83])
        {
            this.yPos += this.speed;
        }
        
        this.xPos = constrain(this.xPos, 0, grid.width - this.width);
        this.yPos = constrain(this.yPos, 0, grid.height - this.height);
    };
     
    this.draw = function() 
    {
        noStroke();
        fill(0, 0, 0, 50);
        rect(this.xPos, this.yPos, this.width, this.height);
    };
};
var viewer = new Viewer(0, 0, 10, 10);

var Button = function(config)
{
    this.xPos = config.xPos;
    this.yPos = config.yPos;
    this.width = config.width;
    this.height = config.height;
    this.color = config.color || color(0, 0, 0, 110);
    
    this.message = config.message || "";
    this.textSize = config.textSize || 12.5;
    this.textColor = config.textColor || 0;
    
    this.draw = function() 
    {
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height);
        fill(0, 0, 0);
        textAlign(CENTER, CENTER);
        textSize(this.textSize);
        fill(this.textColor);
        text(this.message, this.xPos + this.width/2, this.yPos + this.height/2);
    };
};
var buttons = createArray(Button);
buttons.usingRefs = true;

var gameObjectImages = {
    images : {
        'b' : {
            name : "block",
            draw : function(info)
            {
                info.color = color(120, 120, 120);
                noStroke();
                fill(info.color);
                rect(info.xPos, info.yPos, info.width, info.height);
                fill(info.color, info.color, info.color, 30);
                triangle(info.xPos, 
                info.yPos + info.height, 
                info.xPos + info.width, 
                info.yPos, info.xPos, info.yPos);
            },
        },
        'i' : {
            name : "ice",
            draw : function(info)
            {
                info.color = color(33, 198, 207);
                noStroke();
                fill(info.color);
                rect(info.xPos, info.yPos, info.width, info.height);
                fill(info.color, info.color, info.color, 30);
                triangle(info.xPos, info.yPos + info.height, info.xPos + info.width, info.yPos, info.xPos, info.yPos);
            },
        },
        'N' : {
            name : "brick",
            draw : function(info)
            {
                noStroke();
                fill(info.color);
                rect(info.xPos, info.yPos, info.width, info.height);
                fill(info.color, info.color, info.color, 30);
                triangle(info.xPos, info.yPos + info.height,
                info.xPos + info.width, info.yPos, 
                info.xPos, info.yPos);
                triangle(info.xPos, info.yPos, 
                info.xPos, info.yPos + info.height, 
                info.xPos + info.width, info.yPos + info.height);
            },
        },
    },
    getImage : function(sym)
    {
        if(this.images[sym] !== undefined)
        {
            return this.images[sym];
        }else{
            return {
                draw : function() {}
            };
        }
    },
};

var grid = [];
grid.setup = function(xPos, yPos, cols, rows, gridSize)
{
    this.xPos = xPos;
    this.yPos = yPos;
    this.gridSize = gridSize;
    this.symbol = 'a';
    
    this.splice(0, this.length);
    for(var i = 0; i < cols; i++)
    {
        this.push([]);
        for(var j = 0; j < rows; j++)
        {
            this[i].push(' ');
        }
    }
    this.setProps();
};
grid.draw = function() 
{
    for(var i = cam.upperLeft.xPos; i < cam.lowerRight.xPos + 1; i++)
    {
        for(var j = cam.upperLeft.yPos; j < cam.lowerRight.yPos + 1; j++)
        {
            fill(255, 255, 255);
            stroke(0, 0, 0);
            rect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
            gameObjectImages.getImage(this[i][j]).draw({
                xPos : i * this.gridSize,
                yPos : j * this.gridSize,
                width : this.gridSize,
                height : this.gridSize,
                color : color(120, 120, 120)
            });
            fill(0, 0, 0);
            textAlign(CENTER, CENTER);
            textSize(this.gridSize * 0.5);
            text(this[i][j], 
            i * this.gridSize + this.gridSize/2, 
            j * this.gridSize + this.gridSize/2);
        }
    }
};
grid.edit = function(mouse)
{
    if(mouseIsPressed && 
    IsPointInsideRect(mouse, grid) &&
    mouseY < buttons[0].yPos)
    {
        var pos = getPosOnGrid(mouse, grid);
        
        if(mouseButton === LEFT)
        {
            this[pos.xPos][pos.yPos] = this.symbol;
        }
        else if(mouseButton === RIGHT)
        {
            this[pos.xPos][pos.yPos] = ' ';
        }
    }
};
grid.setProps = function()
{
    this.width = this.length * this.gridSize;
    this.height = this[0].length * this.gridSize;
    viewer.width = this.gridSize;
    viewer.height = this.gridSize;
};
grid.save = function()
{
    var toPrint = "[\n";
    for(var i = 0; i < this[0].length; i++)
    {
        toPrint += "    \"";
        for(var j = 0; j < this.length; j++)
        {
           toPrint += this[j][i];
        }
        toPrint += "\",\n";
    }
    toPrint += "]";
    println(toPrint);
};
grid.addCol = function()
{
    this.push([]);
    for(var i = 0; i < this[0].length; i++)
    {
        this[this.length - 1].push(' ');
    }
    this.setProps();
};
grid.removeCol = function()
{
    if(this.length > 1)
    {
        this.pop();
        this.setProps();
    }
};
grid.addRow = function()
{
    for(var i = 0; i < this.length; i++)
    {
        this[i].push(' ');
    }
    this.setProps();
};
grid.removeRow = function()
{
    if(this[0].length > 1)
    {
        for(var i = 0; i < this.length; i++)
        {
            this[i].pop(' ');
        } 
        this.setProps();
    }
};
grid.gridSizeUp = function()
{
    if(this.gridSize < 100)
    {
        this.gridSize++; 
        this.setProps();
    }
};
grid.gridSizeDown = function()
{
    if(this.gridSize > 10)
    {
        this.gridSize--;  
        this.setProps();
    }
};

grid.setup(0, 0, LEVEL_WIDTH, LEVEL_HEIGHT, 40);

var scenes = {
    scene : "grid",
    scenes : {
        "grid" : {
            removeButtons : true,
            setup : function()
            {
                buttons.addObj({
                    name : "selectSymbol",
                    message : "select symbol",
                    xPos : 0,
                    yPos : 370,
                    width : 80,
                    height : 30,
                });
                buttons.addObj({
                    name : "save",
                    message : "save",
                    xPos : 80,
                    yPos : 370,
                    width : 40,
                    height : 30,
                });
                buttons.addObj({
                    name : "editGrid",
                    message : "edit grid",
                    xPos : 120,
                    yPos : 370,
                    width : 60,
                    height : 30,
                });
                buttons.addObj({
                    name : "",
                    message : "",
                    xPos : 180,
                    yPos : 370,
                    width : 220,
                    height : 30,
                });
            },
            mouseReleased : function()
            {
                if(IsPointInsideRect(mouse, buttons.getObj("selectSymbol")))
                {
                    println("Symbol Selected : \'" + key.toString() + "\' (" + gameObjectImages.getImage(key.toString()).name + ")");
                    grid.symbol = key.toString();
                }
                if(IsPointInsideRect(mouse, buttons.getObj("save")))
                {
                    grid.save();
                }
                scenes.buttonToScene("editGrid", "editGrid");
            },
        },
        "editGrid" : {
            removeButtons : true,
            setup : function()
            {
                buttons.addObj({
                    name : "back",
                    message : "<<",
                    xPos : 0,
                    yPos : 370,
                    width : 25,
                    height : 30,
                });
                buttons.addObj({
                    name : "addCol",
                    message : "add Col",
                    xPos : 25,
                    yPos : 370,
                    width : 45,
                    height : 30,
                });
                buttons.addObj({
                    name : "removeCol",
                    message : "remove Col",
                    xPos : 70,
                    yPos : 370,
                    width : 70,
                    height : 30,
                });
                buttons.addObj({
                    name : "addRow",
                    message : "add Row",
                    xPos : 140,
                    yPos : 370,
                    width : 50,
                    height : 30,
                });
                buttons.addObj({
                    name : "removeRow",
                    message : "remove Row",
                    xPos : 190,
                    yPos : 370,
                    width : 65,
                    height : 30,
                });
                buttons.addObj({
                    name : "gridSizeUp",
                    message : "gridSize up",
                    xPos : 255,
                    yPos : 370,
                    width : 70,
                    height : 30,
                });
                buttons.addObj({
                    name : "gridSizeDown",
                    message : "gridSize down",
                    xPos : 325,
                    yPos : 370,
                    width : 75,
                    height : 30,
                });
            },
            mouseReleased : function()
            {
                switch(true)
                {
                    case IsPointInsideRect(mouse, buttons.getObj("addCol")) : 
                            grid.addCol();
                        break;
                        
                    case IsPointInsideRect(mouse, buttons.getObj("removeCol")) : 
                            grid.removeCol();
                        break;
                        
                    case IsPointInsideRect(mouse, buttons.getObj("addRow")) : 
                            grid.addRow();
                        break;
                        
                    case IsPointInsideRect(mouse, buttons.getObj("removeRow")) : 
                            grid.removeRow();
                        break;
                }
                scenes.buttonToScene("back", "grid");
            },
            run : function()
            {
                if(mouseIsPressed)
                {
                    switch(true)
                    {
                        case IsPointInsideRect(mouse, buttons.getObj("gridSizeUp")) :
                                grid.gridSizeUp();
                            break;
                            
                        case IsPointInsideRect(mouse, buttons.getObj("gridSizeDown")) :
                                grid.gridSizeDown();
                            break;
                    }
                }
            },
        },
    },
    get getScene() 
    {
        return scenes.scenes[scenes.scene];
    },
    formFunction : function(name)
    {
        this[name] = function()
        {
            if(this.getScene[name] !== undefined)
            {
                this.getScene[name]();
            }
        };
    },
    setup : function()
    {
        this.formFunction("run");
        this.formFunction("mouseReleased");
        this.changeScene();
    },
    changeScene : function(scene)
    {
        this.scene = scene || this.scene;
        if(this.getScene.removeButtons)
        {
            buttons.clear();
        }
        this.getScene.setup();
    },
    buttonToScene : function(button, scene)
    {
        if(IsPointInsideRect(mouse, buttons.getObj(button)))
        {
            scenes.changeScene(scene || button);
        }
    },
};
scenes.setup();

draw = function() 
{
    background(255, 255, 255);
    pushMatrix();
        cam.view(viewer, grid);
        cam.update(grid);
        grid.draw();
        viewer.draw();
        viewer.update(grid); 
    popMatrix();
    
    scenes.run();
    buttons.draw();
    grid.edit({
        xPos : mouseX + (cam.viewXPos - cam.halfWidth),
        yPos : mouseY + (cam.viewYPos - cam.halfHeight),
    });   
    mouse = {
        xPos : mouseX,
        yPos : mouseY,
    };
    fill(0, 0, 0, 100);
    text("Read in the code for using info!", 200, 10);
};

var lastMouseReleased = mouseReleased;
mouseReleased = function()
{
    lastMouseReleased();
    scenes.mouseReleased();
};

    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});