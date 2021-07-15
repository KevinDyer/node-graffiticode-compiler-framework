/* Copyright (c) 2017, Art Compiler LLC */
/* @flow */
import {
  assert,
  message,
  messages,
  reserveCodeRange,
  decodeID,
  encodeID,
} from "./share.js";
import * as React from "react";
import * as d3 from "d3";

class Viewer extends React.Component {
  componentDidMount() {
    d3.select("#graff-view").append("div").classed("done-rendering", true);
  }

  render() {
    // If you have nested components, make sure you send the props down to the
    // owned components.
    let props = this.props;
    let obj = props.obj ? [].concat(props.obj) : [];
    let elts = [];
    obj.forEach(function (d, i) {
      let style = {};
      if (d.style) {
        Object.keys(d.style).forEach(function (k) {
          style[k] = d.style[k];
        });
      }
      let val = d.value ? d.value : d;
      if (val instanceof Array) {
        val = val.join(" ");
      } else if (typeof val !== "string" &&
                 typeof val !== "number" &&
                 typeof val !== "boolean") {
        val = JSON.stringify(val);
      }
      elts.push(<span key={i} style={style}>{val}</span>);
    });

    return (
      elts.length > 0 ? <div>
        <link rel="stylesheet" href="/L0/style.css" />
        <div className="L0">
        {elts}
        </div>
      </div> : <div/>
    );
  }
};

window.gcexports.viewer = (function () {
  return {
    Viewer: Viewer,
  };
})();
