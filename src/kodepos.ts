import HeaderGenerator from "header-generator";
import cheerio from "cheerio";
import axios from "axios";
import { DataResponse, DataResult, DataResults } from "./types";
import { val } from "cheerio/lib/api/attributes";

class Kodepos {
  private readonly baseurl: string = "https://carikodepos.com/";
  private readonly keywords: string;
  private readonly headers: object;

  constructor(keywords: string) {
    this.keywords = keywords;

    this.headers = new HeaderGenerator({
      browsers: ["chrome", "firefox", "safari"],
      operatingSystems: ["linux", "android", "windows"],
      devices: ["desktop", "mobile"],
      locales: ["id-ID"],
    });
  }

  public async search(): Promise<DataResponse> {
    let url = this.baseurl + "/page/1/?s=" + this.keywords;
    let last = 1;
    try {
      let output = await axios({
        method: "GET",
        url,
        headers: this.headers,
      });
      const $: cheerio.Root = cheerio.load(output.data);
      let lastLink: string | undefined = $(".last").first().attr("href");
      last = parseInt(lastLink?.substring(29, 31)!);
    } catch (error) {
      console.error(error);
    }

    try {
      let indexArr: number[] = [];
      for (let index = 1; index <= last; index++) {
        indexArr.push(index);
      }

      let results: DataResults = [];
      const promises = indexArr.map(async (value) => {
        let res = await this.searchIndex(value);
        return res;
      });

      const numRes = await Promise.all(promises);
      numRes.forEach((res) => {
        res.forEach((value) => {
          results.push(value);
        });
      });

      let response: DataResponse = {
        code: 200,
        status: true,
        messages: "Data search successfully parsed.",
        data: results,
      };

      return response;
    } catch (error) {
      console.error(error);

      let response: DataResponse = {
        code: 500,
        status: false,
        messages: "An error occurred in the script.",
      };

      return response;
    }
  }

  public async searchIndex(index: number): Promise<DataResults> {
    const url = this.baseurl + "/page/" + index + "/?s=" + this.keywords;

    let results: DataResults = [];
    try {
      let output = await axios({
        method: "GET",
        url,
        headers: this.headers,
      });
      const $: cheerio.Root = cheerio.load(output.data);

      let result: DataResult = {};
      let tr: cheerio.Cheerio = $("tr");
      if (tr.length > 0) {
        tr.each((number: number, element: cheerio.Element): void => {
          if (number === 0) return;

          let td: cheerio.Cheerio = $(element).find("td");

          td.each((index: number, html: cheerio.Element): void => {
            let value: string = $(html).find("a").text();
            let key: string =
              index === 0
                ? "province"
                : index === 1
                ? "city"
                : index === 2
                ? "subdistrict"
                : index === 3
                ? "urban"
                : "postalcode";

            result[key] = value.trim();
          });

		  results.push(result);
        });

        return results;
      } else {
        return results;
      }
    } catch (error) {
      console.error(error);
      return results;
    }
  }
}

export default Kodepos;
