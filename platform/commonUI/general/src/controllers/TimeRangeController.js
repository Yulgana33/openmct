/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

define(
    ['moment'],
    function (moment) {
        "use strict";

        var DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

        /**
         * @memberof platform/commonUI/general
         * @constructor
         */
        function TimeConductorController($scope, now) {
            var tickCount = 2,
                initialDragValue;

            function formatTimestamp(ts) {
                return moment.utc(ts).format(DATE_FORMAT);
            }

            function parseTimestamp(text, fallback) {
                var m = moment.utc(text, DATE_FORMAT);
                return m.isValid() ? m.valueOf() : fallback;
            }

            // From 0.0-1.0 to "0%"-"1%"
            function toPercent(p) {
                return (100 * p) + "%";
            }

            function updateTicks() {
                var i, p, ts, start, end, span;
                end = $scope.ngModel.outer.end;
                start = $scope.ngModel.outer.start;
                span = end - start;
                $scope.ticks = [];
                for (i = 0; i < tickCount; i += 1) {
                    p = i / (tickCount - 1);
                    ts = p * span + start;
                    $scope.ticks.push(formatTimestamp(ts));
                }
            }

            function updateSpanWidth(w) {
                // Space about 100px apart
                tickCount = Math.max(Math.floor(w / 100), 2);
                updateTicks();
            }

            function updateViewForInnerSpanFromModel(ngModel) {
                var span = ngModel.outer.end - ngModel.outer.start;

                // Expose readable dates for the knobs
                $scope.startInnerText = formatTimestamp(ngModel.inner.start);
                $scope.endInnerText = formatTimestamp(ngModel.inner.end);

                // And positions for the knobs
                $scope.startInnerPct =
                    toPercent((ngModel.inner.start - ngModel.outer.start) / span);
                $scope.endInnerPct =
                    toPercent((ngModel.outer.end - ngModel.inner.end) / span);
            }

            function defaultBounds() {
                var t = now();
                return {
                    start: t - 24 * 3600 * 1000, // One day
                    end: t
                };
            }

            function copyBounds(bounds) {
                return { start: bounds.start, end: bounds.end };
            }

            function updateViewFromModel(ngModel) {
                var t = now();

                ngModel = ngModel || {};
                ngModel.outer = ngModel.outer || defaultBounds();
                ngModel.inner = ngModel.inner || copyBounds(ngModel.outer);

                // First, dates for the date pickers for outer bounds
                $scope.startOuterDate = formatTimestamp(ngModel.outer.start);
                $scope.endOuterDate = formatTimestamp(ngModel.outer.end);

                // Then various updates for the inner span
                updateViewForInnerSpanFromModel(ngModel);

                // Stick it back is scope (in case we just set defaults)
                $scope.ngModel = ngModel;

                updateTicks();
            }

            function startLeftDrag() {
                initialDragValue = $scope.ngModel.inner.start;
            }

            function startRightDrag() {
                initialDragValue = $scope.ngModel.inner.end;
            }

            function startMiddleDrag() {
                initialDragValue = {
                    start: $scope.ngModel.inner.start,
                    end: $scope.ngModel.inner.end
                };
            }

            function toMillis(pixels) {
                var span = $scope.ngModel.outer.end - $scope.ngModel.outer.start;
                return (pixels / $scope.spanWidth) * span;
            }

            function clamp(value, low, high) {
                return Math.max(low, Math.min(high, value));
            }

            function leftDrag(pixels) {
                var delta = toMillis(pixels);
                $scope.ngModel.inner.start = clamp(
                    initialDragValue + delta,
                    $scope.ngModel.outer.start,
                    $scope.ngModel.inner.end
                );
                updateViewFromModel($scope.ngModel);
            }

            function rightDrag(pixels) {
                var delta = toMillis(pixels);
                $scope.ngModel.inner.end = clamp(
                    initialDragValue + delta,
                    $scope.ngModel.inner.start,
                    $scope.ngModel.outer.end
                );
                updateViewFromModel($scope.ngModel);
            }

            function middleDrag(pixels) {
                var delta = toMillis(pixels),
                    edge = delta < 0 ? 'start' : 'end',
                    opposite = delta < 0 ? 'end' : 'start';

                // Adjust the position of the edge in the direction of drag
                $scope.ngModel.inner[edge] = clamp(
                    initialDragValue[edge] + delta,
                    $scope.ngModel.outer.start,
                    $scope.ngModel.outer.end
                );
                // Adjust opposite knob to maintain span
                $scope.ngModel.inner[opposite] = $scope.ngModel.inner[edge] +
                    initialDragValue[opposite] - initialDragValue[edge];

                updateViewFromModel($scope.ngModel);
            }

            function updateOuterStart(text) {
                var ngModel = $scope.ngModel;
                ngModel.outer.start =
                    parseTimestamp(text, ngModel.outer.start);
                ngModel.outer.end =
                    Math.max(ngModel.outer.start, ngModel.outer.end);
                ngModel.inner.start =
                    Math.max(ngModel.outer.start, ngModel.inner.start);
                ngModel.inner.end =
                    Math.max(ngModel.outer.end, ngModel.inner.end);
                updateViewForInnerSpanFromModel(ngModel);
            }

            function updateOuterEnd(text) {
                var ngModel = $scope.ngModel;
                ngModel.outer.end =
                    parseTimestamp(text, ngModel.outer.end);
                ngModel.outer.start =
                    Math.min(ngModel.outer.end, ngModel.outer.start);
                ngModel.inner.start =
                    Math.min(ngModel.outer.end, ngModel.inner.start);
                ngModel.inner.end =
                    Math.min(ngModel.outer.end, ngModel.inner.end);
                updateViewForInnerSpanFromModel(ngModel);
            }

            $scope.startLeftDrag = startLeftDrag;
            $scope.startRightDrag = startRightDrag;
            $scope.startMiddleDrag = startMiddleDrag;
            $scope.leftDrag = leftDrag;
            $scope.rightDrag = rightDrag;
            $scope.middleDrag = middleDrag;

            $scope.state = false;
            $scope.ticks = [];

            // Initialize scope to defaults
            updateViewFromModel($scope.ngModel);

            $scope.$watchCollection("ngModel", updateViewFromModel);
            $scope.$watch("spanWidth", updateSpanWidth);
            $scope.$watch("startOuterDate", updateOuterStart);
            $scope.$watch("endOuterDate", updateOuterEnd);
        }

        return TimeConductorController;
    }
);