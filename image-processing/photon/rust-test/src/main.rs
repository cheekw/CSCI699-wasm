extern crate photon_rs;
extern crate serde_json;
use photon_rs::monochrome::grayscale;
use photon_rs::native::open_image;
use serde_json::{Result, Value};
use std::fs::File;
use std::time::Instant;

fn main() {
    let mut img = open_image("../../data/blackcat.jpg").expect("File should open");
    let output_path = "./out.json";

    let data = r#"
    {
        "greyscale": {}
    }"#;
    // let v: Value = serde_json::from_str(data)?;

    let mut i: u32 = 1;
    while i < 5 {
        let base: i32 = 10;
        let curr: i32 = base.pow(i);
        let start = Instant::now();

        let mut j: i32 = 1;
        while j < curr {
            grayscale(&mut img);
            j += 1;
        }
        let duration = start.elapsed();
        // v["greyscale"]["curr"] = duration;
        println!("Time elapsed for {:?} runs is: {:?}", curr, duration);
        i += 1;
    }
}
