/*
 * 	BSD 3-Clause License
 *
 * Copyright (c) 2019, NTT Ltd.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 *  Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 *  Neither the name of the copyright holder nor the names of its
 *   contributors may be used to endorse or promote products derived from
 *   this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const chai = require("chai");
const chaiSubset = require("chai-subset");
const fs = require("fs");
const expect = chai.expect;
const asyncTimeout = 120000;
chai.use(chaiSubset);

global.EXTERNAL_CONFIG_FILE = "tests/rpki_tests/config.rpki.test.external.yml";
fs.copyFileSync("tests/rpki_tests/vrp.missing.json", "tests/rpki_tests/vrp.json");

const worker = require("../../index");
const pubSub = worker.pubSub;


pubSub.publish("test-type", "rpki");

describe("RPKI monitoring external", function () {

    it("missing roas", function (done) {

        const expectedData = {

            "a82_112_100_0_24-2914-null": {
                id: "a82_112_100_0_24-2914-null",
                origin: "roa-monitor",
                affected: "82.112.100.0/24",
                message: "The route 82.112.100.0/24 announced by AS2914 is no longer covered by a ROA"
            }

        };

        let rpkiTestCompletedExternal = false;

        pubSub.subscribe("roa", function (message, type) {
            try {

                message = JSON.parse(JSON.stringify(message));
                const id = message.id;

                if (!rpkiTestCompletedExternal && Object.keys(expectedData).includes(id)) {
                    expect(message).to.containSubset(expectedData[id]);

                    expect(message).to.contain
                        .keys([
                            "latest",
                            "earliest"
                        ]);

                    rpkiTestCompletedExternal = true;
                    done();
                }
            } catch (error) {
                rpkiTestCompletedExternal = true;
                done(error);
            }
        });

    }).timeout(asyncTimeout);
});