
async function load() {
  const model = await tf.loadGraphModel('https://big-g.s3.us-east.cloud-object-storage.appdomain.cloud/model.json');
    return model;
  };
async function load_s(){
  const model_s = await tf.loadGraphModel('https://small-g.s3.us-east.cloud-object-storage.appdomain.cloud/model.json');
  return model_s

}
async function load_class(){
  const model_class = await tf.loadGraphModel("https://classy.s3.us-east.cloud-object-storage.appdomain.cloud/model.json");
  return model_class

}


var model = load();
var model_s = load_s();
var model_class =load_class();

var debugc = document.querySelector("#debugc")
console.log(debugc,"here")
debugc.innerHTML = "Debug"


console.log("laoded")
document.querySelector('#file_upload').addEventListener('change', function() {
  console.log("change")
  
  const fileInput = document.getElementById('file_upload').files[0];
  console.log(fileInput,"finput");
  debugc.innerHTML = "found file"
  if (fileInput.name.includes("HEIC"))
  {
    debugc.innerHTML = "Heic is running"
    console.log("HEIC is running")

    blobURL = URL.createObjectURL(fileInput);
    fetch(blobURL)
      .then((res) => res.blob())
      .then((blob) => heic2any({ blob }))
      .then((conversionResult) => {
          console.log("conversion result")
          blobby = conversionResult// conversionResult is a BLOB
          url = URL.createObjectURL(blobby)
          debugc.innerHTML = "blobby created. solving"
          solve(url)

      })
      .catch((e) => {
        debugc.innerHTML = "failure"
        console.log(e);
        console.log("failure")
          // see error handling section
      });
  
  }else
  {
    debugc.innerHTML = "non-heic is running"
    console.log("Non-HEIC")
    readerDim = new FileReader();
    readerDim.readAsDataURL(fileInput);
    console.log(readerDim,"readerDim")
    debugc.innerHTML ="waiting for non heic .onload"
    readerDim.onload = function (e) 
    {
      solve(e.target.result)
  
      //Initiate the JavaScript Image object.
    }
  }

  //don't think FileReader will work with heic so I will have to run ifs and elses here




  function solve(url_to_src) {
    debugc.innerHTML = "made it to solve"
    var image = new Image();
    //Set the Base64 string return from FileReader as source.
    image.src = url_to_src

    //Validate the File Height and Width.
    image.onload = function () {
      debugc.innerHTML = "image loaded"
      //var height = this.height;
      //var width = this.width;

      var a = tf.browser.fromPixels(image);
      console.log(a.shape,image.width,image.height)
      
      //convert image into 3 channel grayscale
      var g_scale =a.mean(2).expandDims(-1);
      var a = tf.image.grayscaleToRGB(g_scale).cast("int32");

      a=a.expandDims();
      tf.browser.toPixels(a.squeeze(),canvas);
      debugc.innerHTML = "a loaded"
      model.then(model => {
      
      async function pred() {
        console.log('Start');
        const result = await model.executeAsync(a);
        debugc.innerHTML = "made first predictions"
        //const classes = await result[2].array();
        //const accuracy = await result[4].array();
        const boxes = await result[6].array(); //y,x,height,width
        
        //Time to draw 
        const canvas = document.querySelector('#canvas');
        const ctx = canvas.getContext('2d');
        //resize

        canvas.height = image.height;
        canvas.width= image.width;
  
       // ctx.drawImage(image,0,0);
       tf.browser.toPixels(a.squeeze(),canvas);
        const [y,x,height,width] =boxes[0][0];//x1, y1, x2, y2, not height or width

        const xc = Math.round(x*a.shape[2]);
        const yc = Math.round(y*a.shape[1]);
        const x2c = Math.round(width*a.shape[2]);
        const y2c = Math.round(height*a.shape[1]);

        var sliced = a.slice([0,yc,xc,0],[1,y2c-yc,x2c-xc,3] );

        tf.browser.toPixels(sliced.squeeze(),canvas2);


        model_s.then(model_s =>{
          async function small_g(sliced){
            console.log("predicting small",sliced);
            const result_s = await model_s.executeAsync(sliced);
           // console.log(result_s)
            const boxes1 = await result_s[6].array();
            //0 second number in arrays is the same as output 4
            //1 is weird. Large numbers
            //2 is classes
            //3 is a big array with size 4 negative numbs tho
            //4 is a single with maybe accuracy but it is odd cause numbers drop off quick
            //5 is a large array with 0.001 ranges of num
            //6 is apparently the classes
            //7 is num of predictions?

            //const [y1,x1,height1,width1] =boxes1[0][0];

            b81 = boxes1[0].splice(0,81)
            var indmap = new Map()

            const canvas_2 = document.querySelector('#canvas2');
            const ctx = canvas_2.getContext('2d');

            for (let i=0; i<81;i++){

              indmap.set(i,b81[i]);
              let y11 = Math.round(b81[i][0]*sliced.shape[1])
              let x11 = Math.round(b81[i][1]*sliced.shape[2])
              let y21 = Math.round(b81[i][2]*sliced.shape[1])
              let x21 = Math.round(b81[i][3]*sliced.shape[2])


              ctx.rect(x11,y11 , x21-x11, y21-y11);
              ctx.stroke();
            }
            //console.log(indmap.get(0))
            var y1Ordered = [0]

            Array.prototype.insert = function ( index, item ) {
              this.splice( index, 0, item );
                };


            for (let i=1;i<81;i++){
              let tElem = indmap.get(i);
              //This loop goes through the elements. Now we need
              //double loop to search where to put the element
              //lower y value is at top of photo
              for (let ind = 0;ind<y1Ordered.length;ind++){
                if (ind+1==y1Ordered.length){
                  if( tElem[0]<indmap.get(y1Ordered[ind])[0] ) {
                    y1Ordered.insert(ind,i);
                    break;
                  }
                  else{
                    y1Ordered.push(i);
                    break;
                  }
                }
                else{
                  if (tElem[0]<indmap.get(y1Ordered[ind])[0]){
                    y1Ordered.insert(ind,i);
                    break;
                  }
                }
              }
            }
            var strata = [];
            for (let i =0;i<9;i++){
              let unorder= y1Ordered.splice(0,9);//splice doesnt need to change bounds because it mutates the array
              let order = [ unorder[0] ];
              for (let each=1;each<9;each++)
              {
                tElem = indmap.get(unorder[each])

                for (let ind=0;ind<order.length;ind++)
                {
                  if (ind+1==order.length)
                  {
                    if( tElem[1]<indmap.get(order[ind])[1] )
                    {
                      order.insert(ind,unorder[each]);
                      break;
                    }
                    else
                    {
                      order.push(unorder[each]);
                      break;
                    }
                  }
                  else
                  {
                    if (tElem[1]<indmap.get(order[ind])[1]) 
                    {
                      order.insert(ind,unorder[each]);
                      break;
                    }
                    //pass
                  } 
                }
              }
            strata[i] =order;

          }
            

            console.log("drawing...");

            let iter1=tf.fill([81], 0).cast('int32')
            var cropped = tf.image.cropAndResize(sliced,b81,iter1,[32,32],'bilinear');
            console.log(cropped,"cropped")

            
            console.log("---0---")
           
            model_class.then(model_class =>{

              async function ttt(){
                function index_max(arr){
                  let ind = -1;
                  let max = -100;
                  
                  for (let i=0;i<arr.length;i++){
                    if (arr[i]>max){
                      ind = i
                      max = arr[i]
                    }
                  }
                  return ind
                  } //end function bracket
              console.log("---1---")

              var l_inputs = document.querySelectorAll('input');
              for (let group =0;group<9;group++)
              {
                for (let i =0;i<9;i++)
                {
                  var test_cropped = cropped.slice([strata[group][i],0,0,0],[1,32,32,3]);
                  //ctx.clearRect(0, 0, canvas.width, canvas.height)
                  //tf.browser.toPixels(test_cropped.squeeze().cast('int32'),canvas);
                  test_cropped = test_cropped.mean(3);
                  test_cropped = test_cropped.expandDims(-1)
                  
                  var result_class = await model_class.execute(test_cropped).array();
                  var ind = index_max(result_class[0])
                  if(ind==0){
                    ind=''
                  }
                  l_inputs[(group*9)+i].value = ind

                  //await new Promise(r => setTimeout(r, 1500));
                }
              }
              
              console.log("-----2------")

              }
              ttt()

            })
         
         
          }
          //console.log(sliced.dataSync())

          const result_s = small_g(sliced);

        });
        };
      console.log('Predicting')
      var box =  pred();

      });

    };
  };


}, false);


    
