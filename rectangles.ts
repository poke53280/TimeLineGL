

class Rectangles {

    gl : any;

    program : any;
    positionAttributeLocation : number;
    resolutionUniformLocation : number;
    contentsizeUniformLocation : number;
    offsetLocation : number;
    y_scaleLocation : number;

    viz_factor1Location : number;
    viz_factor2Location : number;

    buffer : number;
    vao : number;

    rectangle_thickness : number = 7;
    bar_thickness : number = 14;
    nRectangleCount : number = 0;

    row_size : number;

    person_offset : Int32Array;

    nMaxChunk : number;
    json_raw : any[] = [];

    json_mode_old : boolean;


    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     constructor
    //

    constructor(gl : any) {

        this.gl = gl;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     write_rectangle
    //

    write_rectangle(f : Float32Array, iOffset : number, x1 : number, y1 : number, x2 : number, y2 : number, color : number): void {

      f[iOffset + 0] = x1;
      f[iOffset + 1] = y1;
      f[iOffset + 2] = color;

      f[iOffset + 3] = x2;
      f[iOffset + 4] = y1;
      f[iOffset + 5] = color;

      f[iOffset + 6] = x1;
      f[iOffset + 7] = y2;
      f[iOffset + 8] = color;

      f[iOffset + 9] = x1;
      f[iOffset + 10] = y2;
      f[iOffset + 11] = color;

      f[iOffset + 12] = x2;
      f[iOffset + 13] = y1;
      f[iOffset + 14] = color;

      f[iOffset + 15] = x2;
      f[iOffset + 16] = y2;
      f[iOffset + 17] = color;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     build_bar_rectangle
    //

    build_bar_rectangle(f : Float32Array, iOffset : number, begin : number, end : number, color : number, w : number): void {

        const x1 : number = GLUtils.get_x_from_time(this.GetDisplayStartYear(), w, begin);
        const x2 : number = GLUtils.get_x_from_time(this.GetDisplayStartYear(), w, end);

        const y1 : number = 0 * this.row_size;
        const y2 : number = this.getNumberOfPersons() * this.row_size;

        this.write_rectangle(f, iOffset, x1, y1, x2, y2, color);
    }


    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    getRandomInt(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     build_interval_rectangle
    //

    build_interval_rectangle(f : Float32Array, iOffset : number, id : number,
                      begin : number, end : number, color : number, w: number, nSplits : number): void {

      const x1 : number = GLUtils.get_x_from_time(this.GetDisplayStartYear(), w, begin);
      const x2 : number = GLUtils.get_x_from_time(this.GetDisplayStartYear(), w, end);

      const y1_min : number = id * this.row_size;
      const y2_max : number = y1_min + this.rectangle_thickness;

      if (nSplits >= 2) {

        const iSplit : number = this.getRandomInt(0, nSplits -1);

        const y_size: number = y2_max - y1_min;

        const y_slice_size: number = y_size/nSplits;

        const y1: number = y1_min + iSplit * y_slice_size;

        const y2: number = y1 + y_slice_size;

        this.write_rectangle(f, iOffset, x1, y1, x2, y2, color);
      } else {
        this.write_rectangle(f, iOffset, x1, y1_min, x2, y2_max, color);
      }
    }
/*

    AA          Arbeidsavklaringspenger
    ARBEID      Oppfølgingssak
    ATTF      Yrkesrettet attføring
    DAGP    Dagpenger
    ENSLIG Enslig forsørger
    FEILUTBE             Feilutbetaling
    INDIV    Individstønad
    KLAN     Klage/Anke
    MOBIL  Mobilitetsfremmende stønad
    REHAB  Rehabiliteringspenger
    SANKSJON         Sanksjon sykmeldt
    SANKSJON_A    Sanksjon arbeidsgiver
    SANKSJON_B    Sanksjon behandler
    SYKEP   Sykepenger
    TILSTOVER          Tilleggsstønad
    TILSTRAMME    Tilleggsstønad arbeidssøkere
    TILT        Tiltakssak
    UFOREYT             Uføreytelser
    UTRSYA               Utredning KTD
    VLONN Ventelønn
*/

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    // c  GetRectangleColorFromType
    //

    GetRectangleColorFromType(type_str: string): number {


      let offset: number = 0;

      let v: number = 0;

             if (type_str === "AA") {
        v = 1;
      } else if (type_str === "ARBEID") {
        v = 2;
      } else if (type_str === "ATTF") {
        v = 3;
      } else if (type_str === "DAGP") {
        v = 4;
      } else if (type_str === "ENSLIG") {
        v = 5;
      } else if (type_str === "FEILUTBE") {
        v = 6;
      } else if (type_str === "INDIV") {
        v = 7;
      } else if (type_str === "KLAN") {
        v = 8;
      } else if (type_str === "MOBIL") {
        v = 9;
      } else if (type_str === "REHAB") {
        v = 10;
      } else if (type_str === "SANKSJON") {
        v = 11;
      } else if (type_str === "SANKSJON_A") {
        v = 12;
      } else if (type_str === "SANKSJON_B") {
        v = 13;
      } else if (type_str === "SYKEP") {
        v = 14;
      } else if (type_str === "TILSTOVER") {
        v = 15;
      } else if (type_str === "TILSTRAMME") {
        v = 16;
      } else if (type_str === "TILT") {
        v = 17;
      } else if (type_str === "UFOREYT") {
        v = 18;
      } else if (type_str === "UTRSYA") {
        v = 19;
      } else if (type_str === "VLONN") {
        v = 20;
      } else {
        v = 21;
      }

      return offset + v;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    // c     GetDisplayStartYear
    //

    GetDisplayStartYear(): number {
      return this.json_mode_old ? 1995 : 2008;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     buildGLFromData
    //

    buildGLFromData(world_width : number): void {

      const
        nPrimitives : number = this.getNumberOfRectangles();

      const
        nVertexPerRectangle : number = 6;

      const
        nElementsPerVertex : number = 3;

      const
        nElementsPerRectangle : number = nVertexPerRectangle * nElementsPerVertex;

      let cpu_data : Float32Array = new Float32Array(nPrimitives * nElementsPerRectangle);

      this.person_offset = new Int32Array(this.getNumberOfPersons());

      let
        iOffset : number = 0;

      // year bars

      for (let iYear : number = 1996; iYear < 2018; iYear++) {

        const time : number = (iYear - 1970) * 365.242199;

        let
          color : number = 0.91;

        this.build_bar_rectangle(cpu_data, iOffset, time, time + this.bar_thickness, color, world_width);

        iOffset += nElementsPerRectangle;

      }


      if (!this.json_mode_old) {

        var all_types: any = [];


        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

          const
            j : any = this.json_raw[iChunk];

          var keys: any = [];

          for(let k in j) {
            if (j.hasOwnProperty(k)) {
              keys.push(k);
              // code here
            }
          }

          const n: number = keys.length;

          for (let iKey : number = 0; iKey < n; iKey++) {

            const id: number = keys[iKey];

            this.person_offset[id] = iOffset / nElementsPerVertex;

            const time0 : number = (1995 - 1970) * 365.242199;
            const time1 : number = (2018 - 1970) * 365.242199;

            this.build_interval_rectangle(cpu_data, iOffset, id, time0, time1, 0.8, world_width, 0);

            iOffset += nElementsPerRectangle;

            let person: any = j[id];
            var types: any = [];

            for(let k in person) {
              if (person.hasOwnProperty(k)) {
                types.push(k);
              }
            }

            for (let type in types) {
              if (!types.hasOwnProperty(type)) {
                continue;
              }

              if (all_types.indexOf(types[type]) >= 0) {
                // already contained
              } else {
                all_types.push(types[type]);
              }

              let acIntervalData: any = person[types[type]];

              const nIntervalData: number = acIntervalData.length;

              // c Logger.log(1, "id=" + id + "type=" + type + "[" + types[type] + "] #intervals = " + nIntervalData/2);

              for (let iIntervalData : number = 0; iIntervalData < nIntervalData; iIntervalData+=2) {
                const begin: number = acIntervalData[iIntervalData + 0];
                const end: number =   acIntervalData[iIntervalData + 1];

                const color: number = this.GetRectangleColorFromType(types[type]);


                this.build_interval_rectangle(cpu_data, iOffset, id, begin, end, color, world_width, 3);

                iOffset += nElementsPerRectangle;


                // c Logger.log(1, "min=" + acIntervalData[iIntervalData + 0] + ", max=" + acIntervalData[iIntervalData +1]);
              }
            }
          }
        }

        Logger.log(1, "Elements of : " + all_types.length + " type(s) found");

      } else {
        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

        let
          i : any = this.json_raw[iChunk];

        Logger.log(1, "Elements found : " + i.length);

        for (let iPerson : number = 0; iPerson < i.length; iPerson++) {

          const q : any = i[iPerson];
          const id : number = q.id;
          const events : any = q.E;
          const nEvents : number = events.length;

          this.person_offset[id] = iOffset / nElementsPerVertex;

          const time0 : number = (1995 - 1970) * 365.242199;
          const time1 : number = (2018 - 1970) * 365.242199;

          this.build_interval_rectangle(cpu_data, iOffset, id, time0, time1, 0.8, world_width, 0);

          iOffset += nElementsPerRectangle;

          for (let iEvent : number = 0; iEvent < nEvents; iEvent++) {
            const begin : number = events[iEvent];
            const end : number = begin - 14;
            const color : number = 0.6;

            this.build_interval_rectangle(cpu_data, iOffset, id, begin, end, color, world_width, 0);

            iOffset += nElementsPerRectangle;

          }

          const aa_intervals : any[] = q.AA;
          const nAA : number = aa_intervals.length;


          for (let iAA : number = 0; iAA < nAA; iAA += 2) {
            const begin : number = aa_intervals[iAA + 0];
            const end   : number = aa_intervals[iAA + 1];
            const color : number = 0.3;

            this.build_interval_rectangle(cpu_data, iOffset, id, begin, end, color, world_width, 0);

            iOffset += nElementsPerRectangle;
          }
        }
      }
    }
      this.nRectangleCount = nPrimitives;
      this.gl.bufferData(this.gl.ARRAY_BUFFER, cpu_data, this.gl.STATIC_DRAW);
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     getNumberOfPersons
    //

    getNumberOfPersons(): number {

      let
        nPersons : number = 0;

      if (this.json_mode_old) {

        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

          let
            i : any = g_json_raw[iChunk];

            nPersons += i.length;
        }
      } else {

        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

          const
            j : any = this.json_raw[iChunk];

          var keys: any = [];

          for(let k in j) {
            if (j.hasOwnProperty(k)) {
              keys.push(k);
              // code here
            }
          }

          const n: number = keys.length;

          nPersons += n;
        }
      }

      return nPersons;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     getNumberOfYearLines
    //

    getNumberOfYearLines(): number {
      let
        nYearLines : number = 0;

      for (let iYear : number = 1996; iYear < 2018; iYear++) {
        nYearLines++;
      }

      return nYearLines;

    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     getNumberOfRectangles
    //

    getNumberOfRectangles(): number {
      let
          nRectangles : number = 0;

      // year bars

      nRectangles += this.getNumberOfYearLines();

      // intervals

      if (this.json_mode_old) {

        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

            let
            i : any[] = g_json_raw[iChunk];

            for (let iPerson : number = 0; iPerson < i.length; iPerson++) {

            const q : any = i[iPerson];

            const nEvents : number = q.E.length;
            const nAA : number = q.AA.length;

            nRectangles += nEvents;
            nRectangles += nAA;
            }
        }

      } else {
        for (let iChunk : number = 0; iChunk < this.nMaxChunk; iChunk++) {

          const
            j : any = this.json_raw[iChunk];

          var keys: any = [];

          for(let k in j) {
            if (j.hasOwnProperty(k)) {
              keys.push(k);
              // code here
            }
          }

          for (let iKey: number = 0; iKey < keys.length; iKey++) {

            const id: number = keys[iKey];

            let person: any = j[id];
            var types: any = [];

            for(let k in person) {
              if (person.hasOwnProperty(k)) {
                types.push(k);
              }
            }

            for (let type in types) {
              if (!types.hasOwnProperty(type)) {
                continue;
              }

              let acIntervalData: any = person[types[type]];
              const nIntervalData: number = acIntervalData.length;
              nRectangles += nIntervalData/2;
            }
          }
        }
      }

      return nRectangles;
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     setup
    //

    setup(vertex_source : string, fragment_source : string, row_size : number, json_mode_old: boolean,
                    json_raw :  any[], nMaxChunk : number, world_width : number): void {

        this.nMaxChunk = nMaxChunk;
        this.json_raw = json_raw;
        this.json_mode_old = json_mode_old;

        this.row_size = row_size;

        const vertexShader : any = GLUtils.createShader(this.gl, this.gl.VERTEX_SHADER, vertex_source);
        const fragmentShader : any = GLUtils.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragment_source);

        this.program = GLUtils.createProgram(this.gl, vertexShader, fragmentShader);


        // look up where the vertex data needs to go.
        this.positionAttributeLocation = GLUtils.getUniformLocation(this.gl, this.program, "a_position", false);

        this.resolutionUniformLocation = GLUtils.getUniformLocation(this.gl, this.program, "u_resolution", true);
        this.contentsizeUniformLocation = GLUtils.getUniformLocation(this.gl, this.program, "u_contents_size", true);
        this.offsetLocation = GLUtils.getUniformLocation(this.gl, this.program, "pixel_offset", true);
        this.y_scaleLocation = GLUtils.getUniformLocation(this.gl, this.program, "y_scale", true);

        this.viz_factor1Location = GLUtils.getUniformLocation(this.gl, this.program, "viz_factor1", true);
        this.viz_factor2Location = GLUtils.getUniformLocation(this.gl, this.program, "viz_factor2", true);

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.buildGLFromData(world_width);


        // create a vertex array object (attribute state)
        this.vao = this.gl.createVertexArray();

        // and make it the one we're currently working with
        this.gl.bindVertexArray(this.vao);

        // turn on the attribute
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);

        // tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size : any = 3;          // 3 components per iteration
        const type : any = this.gl.FLOAT;   // the data is 32bit floats
        const normalize : any = false; // don't normalize the data
        const stride : any = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset : any = 0;        // start at the beginning of the buffer

        this.gl.vertexAttribPointer(
            this.positionAttributeLocation, size, type, normalize, stride, offset);

    }

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //     render
    //

    render(y : number, y_scale : number, row0: number, row1 : number, isYearLines : boolean,
                                                      x_factor : number, rVizFactor_1: number, rVizFactor_2: number): void {

      this.gl.useProgram(this.program);

      // bind the attribute/buffer set we want.
      this.gl.bindVertexArray(this.vao);

      this.gl.uniform2f(this.resolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);
      this.gl.uniform2f(this.contentsizeUniformLocation, x_factor, 1);
      this.gl.uniform2f(this.offsetLocation, 0, -y);
      this.gl.uniform1f(this.y_scaleLocation, y_scale);

      this.gl.uniform1f(this.viz_factor1Location, rVizFactor_1);
      this.gl.uniform1f(this.viz_factor2Location, rVizFactor_2);

      let count : number = this.nRectangleCount * 6;

      if (isYearLines) {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * this.getNumberOfYearLines());
      }

      let offset : number = 6 * this.getNumberOfYearLines();

      count -= offset;

      const
        offset0 : number = this.person_offset[row0];

      const
        offset1 : number = this.person_offset[row1];

      if (offset0 > count) {
        return;
      }

      let
        newCount : number = offset1 - offset0;

      if (offset0 + newCount > count) {
        newCount = count - offset0;
      }

      this.gl.drawArrays(this.gl.TRIANGLES, offset0, newCount);
    }

}







