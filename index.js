/*
#                                                                                                          #
#                                                   ____ _____ ___                                         #
#                                                  |  __|___  )   \                                        #
#                                       _   _ _   _| |__  _/ /\ O /                                        #
#                                      | | | | | | |___ \(  _)/ _ \                                        #
#                                      | |_| | |_| |___) ) / ( (_) )                                       #
#                                      | ._,_|\___/(____/_/   \___/                                        #
#                                      | |                                                                 #
#                                      |_|                                                                 #
*/

(function()
{
	var shader, error, gl, nogl;

	shader = {
		vert: (function () {/*
		//ifdef GL_ES
			precision lowp float;
		//endif
		
		uniform   vec2 u_resolution;
		attribute vec2 x;
		
		void main(void)
		{
			gl_Position = vec4 (x, 0, 1);
		}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1],

		frag: (function () {/*
		//ifdef GL_ES
			precision lowp float;
		//endif

		uniform bool  u_scanlines;
		uniform vec2  u_resolution;

		uniform float u_brightness;
		uniform float u_blobiness;
		uniform float u_particles;
		uniform float u_millis;
		uniform float u_energy;

		float prnd0(vec2 v)
		{ return fract(cos(dot(v.xy, vec2(12.0, 200.0))) * 2.5); }

		float prnd1(vec2 v)
		{ return fract(sin(dot(v.xy, vec2(1.9, 13.0))) * 4.0); }
		
		float prnd3(vec2 v)
		{ return fract(tan(dot(v.xy * 0.5, vec2(5.0, 80.0))) * 0.5); }

		float prnd4(vec2 v)
		{ return fract(sqrt(log(dot(v.xy * 0.5, vec2(5.0, 80.0))) * 9.0)); }

		void main(void)
		{
			vec2 v0, v2 = vec2(0.5, 0.1 * (u_resolution.y / u_resolution.x));
			vec2 v3, v1 = (gl_FragCoord.xy / u_resolution.x);

			float r0, r1, r2, r3, d;
			float t     = u_millis * 0.004 * u_energy;

			float a     = 0.0;
			float b     = 0.0;
			float c     = 0.0;

			float m     = u_particles / 55.0;
			float k     = 1.0 / u_particles;
			float n     = 4.95;

			for (float i = 0.0; i <= 1.0; i += 0.02) {
				if (i <= m) {
					v3    = vec2(n, n * i);
					r0    = prnd0(v3 * 0.9);
					r1    = prnd1(v3 * 2.8);
					r2    = prnd3(v3 * 0.7);
					r3    = prnd4(v3 * 7.2);
					v0    = v2;
					t     = t - r0 + r3;
					v0.x += sin(t * r0) * cos(t * r1) * atan(t * r0 * 0.10) * 0.1;
					v0.y += sin(t * r2) * sin(t * r3) * atan(v0.x);
					d     = pow(1.6 * r2 / length(v0 - v1), u_blobiness);
					if      (i < m * 0.3) { a += d; }
					else if (i < m * 0.6) { b += d; }
					else                  { c += d; }
					n    += k * r2;
				}
			}
			gl_FragColor = vec4(vec3(a * c, b * c, a * b) * 0.0001 * u_brightness, 1.0);
		}
		*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
	};

	try {
		gl = Sketch.create({
			container  : document.getElementById('glview'),
			type       : Sketch.WEBGL,
			brightness : 1.0,
			blobiness  : 0.9,
			retina     : true,
			particles  : 80,
			energy     : 0.09
		});
	} catch (err) {
		error              = err;
		nogl               = document.getElementById('noglview');
		nogl.style.display = 'block';
	}

	if (gl) {
		gl.setup = function()
		{
			var frag, vert;
			this.clearColor(0.0, 0.0, 0.0, 1.0);
			
			vert                          = this.createShader(this.VERTEX_SHADER);
			frag                          = this.createShader(this.FRAGMENT_SHADER);
			
			this.shaderSource(vert, shader.vert);
			this.shaderSource(frag, shader.frag);
			this.compileShader(vert);
			this.compileShader(frag);
			
			if (!this.getShaderParameter(vert, this.COMPILE_STATUS)) { throw this.getShaderInfoLog(vert); }
			if (!this.getShaderParameter(frag, this.COMPILE_STATUS)) { throw this.getShaderInfoLog(frag); }
			
			this.shaderProgram            = this.createProgram();
			this.attachShader(this.shaderProgram, vert);
			this.attachShader(this.shaderProgram, frag);
			this.linkProgram(this.shaderProgram);
			
			if (!this.getProgramParameter(this.shaderProgram, this.LINK_STATUS)) { throw this.getProgramInfoLog(this.shaderProgram);}
			
			this.useProgram(this.shaderProgram);
			this.shaderProgram.attributes = { v1: this.getAttribLocation(this.shaderProgram, 'x') };
			
			this.shaderProgram.uniforms   = {
				resolution : this.getUniformLocation(this.shaderProgram, 'u_resolution'),
				brightness : this.getUniformLocation(this.shaderProgram, 'u_brightness'),
				blobiness  : this.getUniformLocation(this.shaderProgram, 'u_blobiness'),
				particles  : this.getUniformLocation(this.shaderProgram, 'u_particles'),
				energy     : this.getUniformLocation(this.shaderProgram, 'u_energy'),
				millis     : this.getUniformLocation(this.shaderProgram, 'u_millis')
			};
			
			this.geometry = this.createBuffer();
			this.geometry.vertexCount = 6;
			this.bindBuffer(this.ARRAY_BUFFER, this.geometry);
			this.bufferData(this.ARRAY_BUFFER, new Float32Array(
				[-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
				this.STATIC_DRAW
			);
			
			this.enableVertexAttribArray(this.shaderProgram.attributes.v1);
			this.vertexAttribPointer(this.shaderProgram.attributes.v1, 2, this.FLOAT, false, 0, 0);
			
			return this.resize();
		};
		
		gl.updateUniforms = function()
		{
			if (!this.shaderProgram) { return; }

			this.uniform2f (this.shaderProgram.uniforms.resolution , this.width, this.height);
			this.uniform1f (this.shaderProgram.uniforms.brightness , this.brightness);
			this.uniform1f (this.shaderProgram.uniforms.blobiness  , this.blobiness);
			this.uniform1f (this.shaderProgram.uniforms.particles  , this.particles);

			return this.uniform1f(this.shaderProgram.uniforms.energy, this.energy);
		};
		
		gl.draw = function()
		{
			this.uniform1f  (this.shaderProgram.uniforms.millis , this.millis + 5000);
			this.clear      (this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT);
			this.bindBuffer (this.ARRAY_BUFFER                  , this.geometry);

			return this.drawArrays(this.TRIANGLES, 0, this.geometry.vertexCount);
		};
		
		gl.resize = function()
		{
			this.viewport(0, 0, this.width, this.height);

			return this.updateUniforms();
		};
	}
}).call(this);

/* EOF */